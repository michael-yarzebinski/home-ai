import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { FactCreateDto, FactUpdateDto, SearchRequestDto } from '@home-ai/shared';
import { FactService } from './fact.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { fromFactCreateDto, fromFactUpdateDto, toFactDto } from './fact.mapper';
import { ValidationService } from '../validation/validation.service';

@Controller('admin/facts')
@Roles('admin')
export class FactAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly factService: FactService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    return await this.factService.search(searchRequest);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const row = await this.factService.reader().getById(id, true);
    if (!row) {
      throw new NotFoundException(`Fact "${id}" not found`);
    }
    return toFactDto(row);
  }

  @Post()
  async create(@Body() body: FactCreateDto) {
    const payload = fromFactCreateDto(body);
    const row = await this.factService.createFact(payload);
    return toFactDto(row);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: FactUpdateDto) {
    const row = await this.factService.updateFact(id, fromFactUpdateDto(body));
    return toFactDto(row);
  }
}
