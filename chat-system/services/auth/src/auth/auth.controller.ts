import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthCookie } from "@libs/shared/src/constants/auth.constants";
import { AuthRoutes } from "@libs/shared/src/constants/routes.constants";

import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { RegisterRequestDto } from './dto/request/register-request-user.dto';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RegisterResponseDto } from './dto/response/register-response.dto';

@Controller(AuthRoutes.PREFIX)
export class AuthController {

  constructor(private readonly authService: AuthService) { }

  @Post(AuthRoutes.REGISTER)
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto, res);
  }

  @Post(AuthRoutes.LOGIN)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponseDto> {
    return this.authService.login(loginDto, res);
  }

  @Post(AuthRoutes.REFRESH)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    return this.authService.refresh(req.cookies[AuthCookie.REFRESH_TOKEN], res);
  }
}
