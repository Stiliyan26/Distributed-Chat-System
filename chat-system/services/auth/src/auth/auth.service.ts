import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { Repository } from 'typeorm';

import { AuthCookie, AuthTokenExpiry, CookiePath } from "@libs/shared/src/constants/auth.constants";

import { JwtService } from '@nestjs/jwt';
import { AUTH_CONFIG_KEY, AuthConfig } from '../config/auth.config';
import { AuthError } from '../constants/auth.constants';
import { UserEntity } from '../user/entities/user.entity';
import { LoginUserRequestDto } from './dto/request/login-user.request.dto';
import { RegisterUserRequestDto } from './dto/request/register-user.request.dto';
import { LoginUserResponseDto } from './dto/response/login-user.response.dto';
import { RegisterUserResponseDto } from './dto/response/register-user.response.dto';

@Injectable()
export class AuthService {

    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<{ [AUTH_CONFIG_KEY]: AuthConfig }>
    ) { }

    private get authConfig() {
        return this.configService.get(AUTH_CONFIG_KEY, { infer: true })!;
    }

    async register(registerUserRequestDto: RegisterUserRequestDto, res: Response): Promise<RegisterUserResponseDto> {
        const { password, repeatPassword, ...userData } = registerUserRequestDto;

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

    async login(loginUserRequestDto: LoginUserRequestDto, res: Response): Promise<LoginUserResponseDto> {
        const existingUser = await this.userRepo.findOneBy({ email: loginUserRequestDto.email });

        if (!existingUser) {
            throw new UnauthorizedException(AuthError.USER_NOT_FOUND)
        }

        const isPasswordMatching = await bcrypt.compare(
            loginUserRequestDto.password,
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
        if (!refreshToken) {
            throw new UnauthorizedException(AuthError.REFRESH_TOKEN_IS_ABSENT);
        }

        let payload: { sub: string };

        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.authConfig.jwtRefreshSecret
            });
        } catch {
            this.logger.warn(`Failed refresh attempt: Invalid token format`);
            throw new UnauthorizedException(AuthError.INVALID_REFRESH_TOKEN);
        }

        const user = await this.userRepo.findOneBy({ id: payload.sub });

        if (!user) {
            this.logger.error(`Token valid but user ${payload.sub} not found in DB`);
            throw new UnauthorizedException(AuthError.USER_NOT_FOUND);
        }

        this.logger.debug(`Refreshing session for user: ${user.id}`);

        this.setAuthCookie(res, user);
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
            secret: this.authConfig.jwtSecret,
            expiresIn: AuthTokenExpiry.ACCESS_TOKEN
        });
    }

    private signRefreshToken(user: UserEntity): string {
        return this.jwtService.sign(
            { sub: user.id },
            {
                secret: this.authConfig.jwtRefreshSecret,
                expiresIn: AuthTokenExpiry.REFRESH_TOKEN
            }
        )
    }

    private setAuthCookie(res: Response, user: UserEntity): void {
        const accessToken = this.signAccessToken(user);
        const refreshToken = this.signRefreshToken(user);

        res.cookie(AuthCookie.ACCESS_TOKEN, accessToken, {
            httpOnly: true,
            secure: this.authConfig.nodeEnv === 'production',
            sameSite: AuthCookie.SAME_SITE_STRICT,
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });

        res.cookie(AuthCookie.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            secure: this.authConfig.nodeEnv === 'production',
            sameSite: AuthCookie.SAME_SITE_STRICT,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: CookiePath.REFRESH
        });
    }
}   
