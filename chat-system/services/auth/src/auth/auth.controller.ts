import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

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
  async register(@Body() registerDto: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }
}
