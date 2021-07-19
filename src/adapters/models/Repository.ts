export type FieldsMap<Model = any, Entity = any> = [[keyof Model, (val: any) => any], [keyof Entity, (val: any) => any]][];

export default class Repository<Model, Entity> {
    protected fieldsMap: FieldsMap<Model, Entity>;

    constructor(fieldsMap: FieldsMap<Model, Entity>) {
        this.fieldsMap = fieldsMap;
    }

    protected async toDb(filter: Partial<Entity>): Promise<Partial<Model>> {
        const args = Object.entries(filter);
        const parsedParams: Partial<Model> = {};
        return args.reduce((params, param: [string, any]) => {
            const [entityField, value] = param;
            const [db] = this.fieldsMap.find(([_, [field]]) => field === entityField) || [];
            if (db) {
                const [fieldName, parser] = db;
                params[fieldName] = parser(value);
                return params;
            }
            return params;
        }, parsedParams);
    }

    protected async toEntity(user: Model): Promise<Entity> {
        const fields: [keyof Model, any][] = Object.entries(user) as [keyof Model, any][];
        return fields.reduce((previous, field) => {
            const [_db, entity] = this.fieldsMap.find(([db]) => db[0] === field[0]) || [];
            if (entity) {
                const [name, parser] = entity;
                previous[name] = parser(field[1]) as never;
            }
            return previous;
        }, {} as Entity);
    }
}