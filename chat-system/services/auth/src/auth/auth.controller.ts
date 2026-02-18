import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterUserRequestDto } from './dto/register-user.dto';
import { LoginUserRequestDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() registerDto: RegisterUserRequestDto) {
    return this.authService.register(registerDto);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserRequestDto) {
    return this.authService.login(loginDto);
  }
}
