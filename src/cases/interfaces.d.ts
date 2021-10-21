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

export type Filter<T> = {
    pagination?: Pagination<T>;
    search?: string;
} & Partial<T>;

export type createMethod<Insertion, Entity> = (data: Insertion) => Promise<Entity>;
export type existsMethod<Interface> = (is: Partial<Interface>[]) => Promise<boolean>;
export type filterMethod<Entity, Interface> = (filter: Filter<Interface>) => Promise<Entity[] | Paginated<Entity>>;
export type countMethod<Interface> = (filter: Partial<Interface>) => Promise<number>;
export type getMethod<Entity, Interface> = (filter: Partial<Interface>) => Promise<Entity | undefined>;
export type updateMethod<Entity, Interface> = (id: number, data: Partial<Interface>) => Promise<Entity>;
export type deleteMethod< Interface> = (filter: Partial<Interface>) => Promise<number>;
