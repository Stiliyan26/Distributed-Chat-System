import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';
import databaseConfig from '@libs/shared/src/database/database.config';

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
  controllers: [],
  providers: [],
})
export class AppModule { }
