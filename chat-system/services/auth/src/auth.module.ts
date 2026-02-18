import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import databaseConfig from '@libs/shared/src/database/database.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';

import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    SharedDatabaseModule,
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
