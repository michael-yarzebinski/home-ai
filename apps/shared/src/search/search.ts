export interface SearchCriteriaBase {
    query?: string;
    page: number;
    pageSize: number;
    includeInactive?: boolean;
  }
  
  export type SearchCriteria<T extends SearchCriteriaBase = SearchCriteriaBase> = T;