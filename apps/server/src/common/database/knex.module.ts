import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import knexConfig from '../../../knexfile';

@Module({
  imports: [
    ConfigModule,                    // Make sure ConfigModule is available
  ],
  providers: [
    {
      provide: 'KNEX_CONNECTION',
      useFactory: (configService: ConfigService): Knex => {
        const env = configService.get<string>('NODE_ENV') || 'development';
        
        const config = (knexConfig as any)[env] || knexConfig.development;

        if (!config || !config.client) {
          throw new Error(`Knex configuration for environment "${env}" is missing. Check knexfile.ts`);
        }

        const knexInstance = require('knex')(config);

        console.log(`✅ Knex connected to database: ${config.connection.database}`);
        return knexInstance;
      },
      inject: [ConfigService],        // Use NestJS built-in ConfigService
    },
  ],
  exports: ['KNEX_CONNECTION'],
})
export class KnexModule {}