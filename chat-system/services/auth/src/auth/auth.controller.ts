import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthCookie } from "@libs/shared/src/constants/auth.constants";
import { AuthRoutes } from "@libs/shared/src/constants/routes.constants";

import { AuthService } from './auth.service';
import { LoginUserRequestDto } from './dto/request/login-user.request.dto';
import { RegisterUserRequestDto } from './dto/request/register-user.request.dto';
import { LoginUserResponseDto } from './dto/response/login-user.response.dto';
import { RegisterUserResponseDto } from './dto/response/register-user.response.dto';

@Controller(AuthRoutes.PREFIX)
export class AuthController {

  constructor(private readonly authService: AuthService) { }

  @Post(AuthRoutes.REGISTER)
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerUserRequestDto: RegisterUserRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<RegisterUserResponseDto> {
    return this.authService.register(registerUserRequestDto, res);
  }

  @Post(AuthRoutes.LOGIN)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserRequestDto: LoginUserRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginUserResponseDto> {
    return this.authService.login(loginUserRequestDto, res);
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
