import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "../entities/user.entity";
import { DATABASE_CONFIG_KEY } from "../config/env.validation";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get(DATABASE_CONFIG_KEY);

        return {
          type: dbConfig.type,
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          synchronize: dbConfig.synchronize,
          autoLoadEntities: true,
          logging: true,
          entities: [User],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }