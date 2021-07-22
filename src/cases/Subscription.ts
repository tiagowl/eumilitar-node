export interface SubscriptionRepositoryInterface {

}

export default class SubscriptionCase {
    private repository: SubscriptionRepositoryInterface;

    constructor(repository: SubscriptionRepositoryInterface) {
        this.repository = repository;
    }

    public async create(){
        
    }
}