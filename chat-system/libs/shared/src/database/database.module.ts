import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { addTransactionalDataSource } from "typeorm-transactional";

import { DATABASE_CONFIG_KEY } from "./database.config";


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
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('DataSource options are not defined');
        }
        
        return addTransactionalDataSource(new DataSource(options));
      }
    }),
  ],
})
export class SharedDatabaseModule { }