export type Course = 'esa' | 'espcex';

export interface ProductInterface {
    id: number;
    name: string;
    code: number;
    course: Course;
}

export default class Product implements ProductInterface {
    readonly id: number;
    public name: string;
    public code: number;
    public course: Course;

    constructor(data: ProductInterface) {
        this.id = data.id;
        this.name = data.name;
        this.code = data.code;
        this.course = data.course;
    }
}