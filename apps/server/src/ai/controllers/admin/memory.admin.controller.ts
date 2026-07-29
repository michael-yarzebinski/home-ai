import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Role } from '@home-ai/shared/domain/role/role';
import {
  MemorySearchCriteriaSchema,
  type MemoryRecord,
  type MemorySearchCriteria,
} from '@home-ai/shared/admin/memory/memory';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { ChromaService } from '../../memory/chroma.service';

@Controller('v1/admin/memory')
@Roles(Role.ADMIN)
export class MemoryAdminController {
  constructor(private readonly chromaService: ChromaService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(MemorySearchCriteriaSchema)) dto: MemorySearchCriteria,
  ): Promise<Paginated<MemoryRecord>> {
    return this.chromaService.search(dto);
  }
}
