import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConsecutiveBreaker,
  IPolicy,
  bulkhead,
  circuitBreaker,
  handleAll,
  isBrokenCircuitError,
  isBulkheadRejectedError,
  wrap,
} from 'cockatiel';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import proxy from 'express-http-proxy';

import type { DownstreamKey } from './downstream-key';

function runProxyWithCompletion(
  proxyMw: RequestHandler,
  req: Request,
  res: Response,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      res.removeListener('finish', onFinish);
      res.removeListener('error', onResError);
      req.removeListener('aborted', onAborted);
    };

    const settleReject = (reason: unknown) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(reason);
    };

    const settleResolve = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve();
    };

    const onFinish = () => {
      if (settled) {
        return;
      }

      if (res.statusCode >= 500) {
        settleReject(new Error(`Upstream returned ${res.statusCode}`));
        return;
      }

      settleResolve();
    };

    const onResError = (err: Error) => {
      settleReject(err);
    };

    const onAborted = () => {
      settleReject(new Error('Request aborted'));
    };

    res.once('finish', onFinish);
    res.once('error', onResError);
    req.once('aborted', onAborted);

    proxyMw(req, res, ((err?: unknown) => {
      if (err) {
        settleReject(err);
      }
    }) as NextFunction);
  });
}

@Injectable()
export class ResilientProxyFactory {
  private readonly logger = new Logger(ResilientProxyFactory.name);
  private readonly policyByDownstream = new Map<DownstreamKey, IPolicy>();
  private readonly httpProxyByKey = new Map<string, RequestHandler>();

  constructor(private readonly configService: ConfigService) { }

  createHttpProxy(downstream: DownstreamKey, host: string): RequestHandler {
    const cacheKey = `${downstream}::${host}`; // 'auth::http://localhost:3001'
    const existing = this.httpProxyByKey.get(cacheKey);

    if (existing) {
      return existing;
    }

    const timeoutMs = this.configService.get<number>('gateway.proxyTimeoutMs')!;
    const bodyLimit = this.configService.get<string>('gateway.proxyBodyLimit')!;

    const inner = proxy(host, {
      timeout: timeoutMs,
      limit: bodyLimit,
      proxyReqOptDecorator: (proxyReqOpts) => {
        return { ...proxyReqOpts, timeout: timeoutMs };
      },
      // Ensure JSON bodies parsed by Nest reach the upstream (avoids empty-body edge cases).
      // Only touch methods that may carry a JSON body — never attach a body to GET/HEAD or it can break upstream routes.
      proxyReqBodyDecorator: (bodyContent, srcReq) => {
        const req = srcReq as Request;
        const m = req.method?.toUpperCase() ?? '';
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) {
          return bodyContent;
        }
        if (
          req.body &&
          typeof req.body === 'object' &&
          !Buffer.isBuffer(req.body)
        ) {
          return JSON.stringify(req.body);
        }
        return bodyContent;
      },
    });

    const wrapped = this.wrapRequestHandler(inner, downstream);
    this.httpProxyByKey.set(cacheKey, wrapped);

    return wrapped;
  }

  wrapRequestHandler(inner: RequestHandler, downstream: DownstreamKey): RequestHandler {
    const policy = this.getPolicyFor(downstream);

    return (req: Request, res: Response, next: NextFunction) => {
      policy
        .execute(() => runProxyWithCompletion(inner, req, res))
        .then(() => undefined)
        .catch((err: unknown) => {
          if (isBrokenCircuitError(err)) {
            this.logger.warn(`[${downstream}] Circuit open — short-circuiting proxy`);

            if (!res.headersSent) {
              res.status(503).json({
                statusCode: 503,
                message: 'Service temporarily unavailable',
                error: 'CircuitOpen',
              });
            }

            return;
          }

          if (isBulkheadRejectedError(err)) {
            this.logger.warn(`[${downstream}] Bulkhead full — rejecting request`);

            if (!res.headersSent) {
              res.setHeader('Retry-After', '1');
              res.status(503).json({
                statusCode: 503,
                message: 'Service overloaded',
                error: 'BulkheadFull',
              });
            }

            return;
          }

          next(err instanceof Error ? err : new Error(String(err)));
        });
    };
  }

  private getPolicyFor(downstream: DownstreamKey): IPolicy {
    const cached = this.policyByDownstream.get(downstream);

    if (cached) {
      return cached;
    }

    const halfOpenAfter = this.configService.get<number>('gateway.breakerHalfOpenAfterMs')!;
    const consecutive = this.configService.get<number>('gateway.breakerConsecutiveFailures')!;


    const breaker = circuitBreaker(handleAll, {
      halfOpenAfter,
      breaker: new ConsecutiveBreaker(consecutive),
    });

    const concurrency = this.configService.get<number>('gateway.bulkheadConcurrency')!;
    const queue = this.configService.get<number>('gateway.bulkheadQueue')!;

    const bh = bulkhead(concurrency, queue);
    const merged = wrap(breaker, bh);

    this.policyByDownstream.set(downstream, merged);

    return merged;
  }
}
