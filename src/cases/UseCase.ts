import { RepositoryInterface } from "./interfaces";



export default class UseCase<Entity, Filter> {
    protected readonly repository: RepositoryInterface<Entity, Filter>;

    constructor(repository: RepositoryInterface<Entity, Filter>) {
        this.repository = repository;
    }

    public findAll() {

    }

}