import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { RecipesService } from './recipe.service';
import { toRecipeDto } from './recipe.mapper';
import { ValidationService } from 'src/core/validation/validation.service';

@Controller('v1/recipes')
export class RecipesController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly recipesService: RecipesService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    searchRequest.includeInactive = false;
    return await this.recipesService.search(searchRequest);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const row = await this.recipesService.reader().getById(id);
    if (!row || row.active !== true) {
      throw new NotFoundException(`Recipe "${id}" not found`);
    }
    return toRecipeDto(row);
  }
}
