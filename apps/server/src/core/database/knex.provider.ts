import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import * as knexConfig from '../../../knexfile';

export const KnexProvider: Provider = {
  provide: 'KNEX_CONNECTION',
  useFactory: (configService: ConfigService) => {
    const env = configService.get<string>('NODE_ENV') || 'development';
    const config = knexConfig[env] || knexConfig.default;

    const knexInstance: Knex = require('knex')(config);

    console.log('✅ Knex database connection initialized successfully');
    return knexInstance;
  },
  inject: [ConfigService],
};