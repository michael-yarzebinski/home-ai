import { Controller, Get } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { ConfigService } from '@nestjs/config';

@Controller('admin/health')
export class HealthController {
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async checkHealth() {
    const startTime = Date.now();

    try {
      // Check database connectivity
      await this.knex.raw('SELECT 1');

      const uptime = process.uptime();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime)} seconds`,
        services: {
          database: 'connected',
          ollama: 'pending',           // TODO: Add real check
          bluebubbles: 'pending',      // TODO: Add real check
          server: 'running',
        },
        config: {
          server_port: this.configService.get('SERVER_PORT'),
          weather_zip: this.configService.get('WEATHER_ZIP_CODE'),
        },
        latency_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          database: 'disconnected',
        },
      };
    }
  }
}