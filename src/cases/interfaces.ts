

export interface RepositoryInterface<Entity, Filter> {
    get: (filter: Filter) => Promise<Entity | null | undefined>;
    filter: (filter: Filter) => Promise<this>;
    update: (data: Filter) => Promise<number>;
}