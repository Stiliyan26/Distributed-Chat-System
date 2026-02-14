import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DATABASE_CONFIG_KEY } from "../../../../libs/shared/src/database/database.config";

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
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class SharedDatabaseModule { }