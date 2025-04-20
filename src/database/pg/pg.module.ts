// Imports
import { Module } from '@nestjs/common';
import { PgService } from './pg.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { postgresqlConfigs } from 'src/config/configuration';
import { PG_CORE_ENTITIES } from './pg.entities';
import { Env } from 'src/config/env';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      useFactory: (_: ConfigService) => ({
        ...postgresqlConfigs,
        database: Env.database.postgresql.core_db_name,
        define: {
          freezeTableName: false,
          charset: 'utf8',
          collate: 'utf8_general_ci',
        },
        models: PG_CORE_ENTITIES,
        synchronize: false,
      }),

      inject: [ConfigService],
    }),
  ],
  providers: [PgService],
  exports: [PgService],
  controllers: [],
})
export class PgModule {}
