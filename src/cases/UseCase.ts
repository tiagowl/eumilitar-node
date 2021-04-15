import { Repository } from "./interfaces";

export default class UseCase<Entity> {
    protected readonly repository: Repository<Entity>;

    constructor(repository: Repository<Entity>) {
        this.repository = repository;
    }

    public findAll() {

    }

}