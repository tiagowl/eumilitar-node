

export interface RepositoryInterface<Entity, Filter> {
    get: (filter: Filter) => Promise<Entity | null | undefined>;
}