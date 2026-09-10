import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserStore } from "../stores/user/user.store";
import { LogStore } from "../stores/monitoring/log/log.store";
import type { JwtPayload } from "../auth/jwt.strategy";
import { Trace } from "src/common/decorators/trace.decorator";

export interface LoginResult {
  accessToken: string;
  userId: string;
  name: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userStore: UserStore,
    private readonly jwtService: JwtService,
    private readonly logStore: LogStore,
  ) {}

  @Trace()
  async login(name: string, code: string): Promise<LoginResult> {
    const users = await this.userStore.getAll();
    const user = users.find((u) => u.name.toLowerCase() === name.toLowerCase());

    if (!user) throw new UnauthorizedException("Invalid name or code");

    const valid = await bcrypt.compare(code, user.accessCodeHash);
    if (!valid) throw new UnauthorizedException("Invalid name or code");

    const payload: JwtPayload = { sub: user.id, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      userId: user.id,
      name: user.name,
      role: user.role,
    };
  }
}
