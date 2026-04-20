import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SearchRequestDto, UserCreateDto, UserUpdateDto } from '@home-ai/shared';
import { UsersService } from './user.service';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { fromCreateDto, fromUpdateDto, toUserDto } from './user.mapper';
import { ValidationService } from '../../validation/validation.service';

@Controller('admin/users')
@Roles('admin')
export class UserAdminController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly usersService: UsersService,
  ) {}

  @Post('search')
  async search(@Body() body: SearchRequestDto) {
    const searchRequest = await this.validationService.validateAndTransform(body, SearchRequestDto);
    return await this.usersService.search(searchRequest);
  }

  @Post()
  async create(@Body() createUserDto: UserCreateDto) {
    const user = await this.usersService.createUser(fromCreateDto(createUserDto));
    return toUserDto(user);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.usersService.reader().getById(id, true);
    return toUserDto(user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updates: UserUpdateDto) {
    const user = await this.usersService.updateUser(id, fromUpdateDto(updates));
    return toUserDto(user);
  }
}
