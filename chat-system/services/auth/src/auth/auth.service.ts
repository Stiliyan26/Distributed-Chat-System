import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';
import { AuthCookie, AuthError, AuthTokenExpiry, CookiePath } from '../constants';
import { UserEntity } from '../user/entities/user.entity';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { RegisterRequestDto } from './dto/request/register-request-user.dto';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RegisterResponseDto } from './dto/response/register-response.dto';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly jwtService: JwtService
    ) { }

    async register(registerDto: RegisterRequestDto, res: Response): Promise<RegisterResponseDto> {
        const { password, repeatPassword, ...userData } = registerDto;

        if (password !== repeatPassword) {
            throw new BadRequestException(AuthError.PASSWORDS_MISMATCH);
        }

        const userExists: boolean = await this.userRepo.exists({
            where: { email: userData.email }
        });

        if (userExists) {
            throw new ConflictException(AuthError.USER_EXISTS);
        }

        const hashedPassword = await this.hashPassword(password);

        const userEntity = this.userRepo.create({
            ...userData,
            password: hashedPassword
        });

        const savedUser = await this.userRepo.save(userEntity);

        this.setAuthCookie(res, savedUser);

        return {
            id: savedUser.id,
            username: savedUser.username,
            email: savedUser.email
        }
    }

    async login(loginDto: LoginRequestDto, res: Response): Promise<LoginResponseDto> {
        const existingUser = await this.userRepo.findOneBy({ email: loginDto.email });

        if (!existingUser) {
            throw new UnauthorizedException(AuthError.USER_NOT_FOUND)
        }

        const isPasswordMatching = await bcrypt.compare(
            loginDto.password,
            existingUser.password
        )

        if (!isPasswordMatching) {
            throw new UnauthorizedException(AuthError.INVALID_CREDENTIALS);
        }

        this.setAuthCookie(res, existingUser);

        return {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email
        };
    }

    async refresh(refreshToken: string, res: Response) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET
            });

            const user = await this.userRepo.findOneBy({ id: payload.sub });

            if (!user) {
                throw new UnauthorizedException();
            }

            this.setAuthCookie(res, user);
        } catch {
            throw new UnauthorizedException(AuthError.INVALID_REFRESH_TOKEN)
        }
    }

    private async hashPassword(password: string) {
        const salt = await bcrypt.genSalt();

        return await bcrypt.hash(password, salt);
    }

    private signAccessToken(user: UserEntity) {
        return this.jwtService.sign({
            sub: user.id,
            username: user.username,
            email: user.email
        }, {
            secret: process.env.JWT_SECRET,
            expiresIn: AuthTokenExpiry.ACCESS_TOKEN
        });
    }

    private signRefreshToken(user: UserEntity): string {
        return this.jwtService.sign(
            { sub: user.id },
            {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: AuthTokenExpiry.REFRESH_TOKEN
            }
        )
    }

    private setAuthCookie(res: Response, user: UserEntity): void {
        const accessToken = this.signAccessToken(user);
        const refreshToken = this.signRefreshToken(user);

        res.cookie(AuthCookie.ACCESS_TOKEN, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: AuthCookie.SAME_SITE_STRICT,
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });

        res.cookie(AuthCookie.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: AuthCookie.SAME_SITE_STRICT,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: CookiePath.REFRESH
        });
    }
}   
