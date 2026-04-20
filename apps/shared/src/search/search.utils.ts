import { SearchRequestDto, SearchResponseDto } from "./search.dto";

export class SearchUtils {
    static toSearchResponseDto<T>(searchRequest: SearchRequestDto, items: T[], total: number): SearchResponseDto<T> {
        return {
            items,
            total,
            pageNumber: searchRequest.pageNumber,
            pageSize: searchRequest.pageSize,
        }
    }

    static toSkipTake(searchRequest: SearchRequestDto): {
        skip?: number;
        take?: number;
    } {
        if (!searchRequest.pageNumber || !searchRequest.pageSize) {
            return {}
        }

        return {
            skip: searchRequest.pageNumber - 1 * searchRequest.pageSize,
            take: searchRequest.pageSize
        }

    }
}