import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { FactService } from './fact.service';
import { toFactDto } from './fact.mapper';
import { ValidationService } from '../validation/validation.service';

@Controller('v1/facts')
export class FactController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly factService: FactService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    searchRequest.includeInactive = false;
    return await this.factService.search(searchRequest);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const row = await this.factService.reader().getById(id);
    return toFactDto(row);
  }
}
