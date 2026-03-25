import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import databaseConfig from '@libs/shared/src/database/database.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../user/users.module';
import { UserEntity } from '../user/entities/user.entity';
import authConfig from '../config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig],
    }),
    SharedDatabaseModule,
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({}),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
