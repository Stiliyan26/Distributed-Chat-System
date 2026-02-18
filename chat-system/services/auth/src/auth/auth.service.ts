import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserEntity } from '../entities/user.entity';
import { LoginUserRequestDto } from './dto/login-user.dto';
import { RegisterUserRequestDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) { }

    async register(registerDto: RegisterUserRequestDto) {
        const { password, ...userData } = registerDto;

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const userEntity = this.userRepo.create({
            ...userData,
            password: hashedPassword
        });

        return this.userRepo.save(userEntity);
    }

    async login(loginDto: LoginUserRequestDto) {
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

        return existingUser;
    }
}   
