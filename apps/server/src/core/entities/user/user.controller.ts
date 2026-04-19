import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { UsersService } from './user.service';

@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {
  }

  @Get()
  async getAll() {
    return this.usersService.reader().getAll();
  }

  @Post()
  async create(@Body() createUserDto: any) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':user_id')
  async findOne(@Param('user_id') user_id: string) {
    return this.usersService.reader().getById(user_id);
  }

  @Patch(':user_id')
  async update(@Param('user_id') user_id: string, @Body() updates: any) {
    return this.usersService.updateUser(user_id, updates);
  }
}