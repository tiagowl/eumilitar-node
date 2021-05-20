import User from './User';
import Theme, { Course } from './EssayTheme';


export interface EssayInterface {
    file: string;
    student: User;
    course: Course;
    theme: Theme;
    lastModified: Date;
}

export default class Essay {
    #file: string;
    #student: User;
    #course: Course;
    #theme: Theme;
    #lastModified: Date;

    constructor(data: EssayInterface) {
        this.#course = data.course;
        this.#file = data.file;
        this.#student = data.student;
        this.#theme = data.theme;
        this.#lastModified = data.lastModified;
    }

    get file() { return this.#file }
    set file(value: string) {
        this.#file = value;
        this.updateLastModified();
    }

    get student() { return this.#student }
    set student(value: User) {
        this.#student = value;
        this.updateLastModified();
    }

    get course() { return this.#course }
    set course(value: Course) {
        this.#course = value;
        this.updateLastModified();
    }

    get theme() { return this.#theme }
    set theme(value: Theme) {
        this.#theme = value;
        this.updateLastModified();
    }

    get lastModified() { return this.#lastModified }

    private updateLastModified() { this.#lastModified = new Date(); }

}