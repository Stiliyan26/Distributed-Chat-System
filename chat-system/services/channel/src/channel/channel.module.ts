import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChannelController } from './controllers/channel.controller';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelService } from './services/channel.service';

import databaseConfig from '@libs/shared/src/database/database.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';
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
  providers: [ChannelService],
})
export class ChannelModule { }
