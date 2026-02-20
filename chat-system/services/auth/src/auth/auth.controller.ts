import { Body, Controller, HttpCode, HttpStatus, Post, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login/login-request.dto';
import { LoginResponseDto } from './dto/login/login-response.dto';
import { RegisterRequestDto } from './dto/register/register-request-user.dto';
import { RegisterResponseDto } from './dto/register/register-response.dto';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) { }

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto, res);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponseDto> {
    return this.authService.login(loginDto, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.refresh(req.cookies['refresh_token'], res);
  }
}
