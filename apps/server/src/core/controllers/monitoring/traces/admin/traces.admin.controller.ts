import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { Roles } from "../../../../../common/decorators/roles.decorator";
import { Role } from "@home-ai/shared/domain/role/role";
import { ZodValidationPipe } from "../../../../../common/pipes/zod-validation.pipe";
import {
  SearchCriteriaSchema,
  type SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import { TraceService } from "../../../../services/trace.service";

@Controller("v1/admin/traces")
@Roles(Role.ADMIN)
export class TracesAdminController {
  constructor(private readonly traceService: TraceService) {}

  @Post("search")
  @HttpCode(HttpStatus.OK)
  search(
    @Body(new ZodValidationPipe(SearchCriteriaSchema)) dto: SearchCriteriaBase,
  ) {
    return this.traceService.search(dto);
  }

  @Get(":traceId")
  async getById(@Param("traceId") traceId: string) {
    const item = await this.traceService.getById(traceId);
    if (!item) {
      throw new NotFoundException(`Trace ${traceId} not found`);
    }
    return item;
  }
}
