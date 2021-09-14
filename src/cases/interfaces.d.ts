export interface Pagination<T> {
    page?: number;
    pageSize?: number;
    ordering?: keyof T;
}

export interface Paginated<T> {
    pages: number;
    page: T[];
    count: number;
}

export type Chart = {
    key: string;
    value: number;
}[];