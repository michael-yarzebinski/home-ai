import type { Insertable, Updatable } from "@home-ai/shared/common/crud.helper";
import type { Paginated } from "@home-ai/shared/search/pagination";
import type {
  SearchCriteria,
  SearchCriteriaBase,
} from "@home-ai/shared/search/search";
import { AuthUser } from "../../auth/jwt.strategy";

export interface BaseStore<
  TDomain,
  TRecord,
  TInsertable = Insertable<TDomain>,
  TUpdatable = Updatable<TDomain>,
  TSearchCriteria extends SearchCriteriaBase = SearchCriteriaBase,
> {
  search(
    criteria: SearchCriteria<TSearchCriteria>,
    user?: AuthUser,
  ): Promise<Paginated<TDomain>>;
  create(data: TInsertable, user?: AuthUser): Promise<TDomain>;
}
