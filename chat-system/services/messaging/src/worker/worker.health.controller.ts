import { Controller, Get } from "@nestjs/common";

@Controller()
export class WorkerHealthController {
  @Get()
  root() {
    return {
      service: "messaging-worker",
      status: "ok",
    };
  }

  @Get("health")
  health() {
    return {
      service: "messaging-worker",
      status: "ok",
    };
  }
}
