import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  RecipeCreateDto,
  SearchRequestDto,
  SetActiveDto,
  RecipeUpdateDto,
} from '@home-ai/shared';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RecipesService } from './recipe.service';
import {
  fromRecipeCreateDto,
  fromRecipeUpdateDto,
  toRecipeDto,
} from './recipe.mapper';
import { ValidationService } from 'src/core/validation/validation.service';

@Controller('admin/recipes')
@Roles('admin')
export class RecipesAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly recipesService: RecipesService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    return await this.recipesService.search(searchRequest);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const row = await this.recipesService.reader().getById(id);
    if (!row) {
      throw new NotFoundException(`Recipe "${id}" not found`);
    }
    return toRecipeDto(row);
  }

  @Post()
  async create(@Body() body: RecipeCreateDto) {
    const row = await this.recipesService.createRecipe(fromRecipeCreateDto(body));
    return toRecipeDto(row);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: RecipeUpdateDto) {
    const row = await this.recipesService.updateRecipe(id, fromRecipeUpdateDto(body));
    return toRecipeDto(row);
  }

  @Patch(':id/active')
  async setActive(@Param('id') id: string, @Body() body: SetActiveDto) {
    const row = await this.recipesService.setRecipeActive(id, body.active);
    return toRecipeDto(row);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const n = await this.recipesService.deleteRecipe(id);
    return { deleted: n };
  }
}
