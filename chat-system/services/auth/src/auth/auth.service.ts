import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Response } from 'express';

import { UserEntity } from '../entities/user.entity';
import { LoginRequestDto } from './dto/login/login-request.dto';
import { LoginResponseDto } from './dto/login/login-response.dto';
import { RegisterRequestDto } from './dto/register/register-request-user.dto';
import { RegisterResponseDto } from './dto/register/register-response.dto';
import { JwtService } from '@nestjs/jwt';

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
            throw new BadRequestException(`Passwords don't match.`);
        }

        const userExists: boolean = await this.userRepo.exists({
            where: { email: userData.email }
        });

        if (userExists) {
            throw new ConflictException('User with this email already exists');
        }

        const hashedPassword = await this.hashPassword(password);

        const userEntity = this.userRepo.create({
            ...userData,
            password: hashedPassword
        });

        const savedUser = await this.userRepo.save(userEntity);

        this.setupJwtTokenInCookie(res, savedUser);

        return {
            id: savedUser.id,
            username: savedUser.username,
            email: savedUser.email
        }
    }

    async login(loginDto: LoginRequestDto, res: Response): Promise<LoginResponseDto> {
        const existingUser = await this.userRepo.findOneBy({ email: loginDto.email });

        if (!existingUser) {
            throw new UnauthorizedException('User not found.')
        }

        const isPasswordMatching = await bcrypt.compare(
            loginDto.password,
            existingUser.password
        )

        if (!isPasswordMatching) {
            throw new UnauthorizedException('Invalid credentials');
        }

        this.setupJwtTokenInCookie(res, existingUser);

        return {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email
        };
    }

    private async hashPassword(password: string) {
        const salt = await bcrypt.genSalt();

        return await bcrypt.hash(password, salt);
    }

     private setupJwtTokenInCookie(res: Response, user: UserEntity) {
        const token = this.jwtService.sign({
            sub: user.id,
            username: user.username,
            email: user.email
        });

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    }
}   
