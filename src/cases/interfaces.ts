

export interface Repository<Entity> {
    get: (filter: any) => Promise<Entity | null | undefined>;
}