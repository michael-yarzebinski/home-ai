import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SearchRequestDto } from '@home-ai/shared';
import { UsersService } from './user.service';
import { toUserDto } from './user.mapper';
import { ValidationService } from 'src/core/validation/validation.service';

@Controller('v1/users')
export class UserController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly usersService: UsersService) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    searchRequest.includeInactive = false;

    return await this.usersService.search(searchRequest);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.usersService.reader().getById(id);
    return toUserDto(user);
  }
}
