import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChannelController } from './channel.controller';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelService } from './channel.service';

import databaseConfig from '@libs/shared/src/database/database.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';
import { UserHeaderGuard } from '@libs/shared/src/guards/user-header.guard';
import { APP_GUARD } from '@nestjs/core';
import { ChannelMemberEntity } from './entities/channel-member.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig]
    }),
    SharedDatabaseModule,
    TypeOrmModule.forFeature([
      ChannelEntity,
      ChannelMemberEntity
    ])
  ],
  controllers: [ChannelController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserHeaderGuard
    },
    ChannelService
  ],
})
export class ChannelModule { }
