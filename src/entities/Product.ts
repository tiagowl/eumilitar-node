export interface ProductInterface {
    id: number;
    name: string;
    code: number;
}

export default class Product implements ProductInterface {
    readonly id: number;
    public name: string;
    public code: number;

    constructor(data: ProductInterface) {
        this.id = data.id;
        this.name = data.name;
        this.code = data.code;
    }
}