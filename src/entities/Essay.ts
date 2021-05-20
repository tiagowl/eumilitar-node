import { Course } from './EssayTheme';


type Status = "invalid" | "pending" | "revised";

export interface EssayInterface {
    id: number;
    file: string;
    student: number;
    course: Course;
    theme: number;
    lastModified: Date;
    status: Status;
}

export default class Essay {
    #id: number;
    #file: string;
    #student: number;
    #course: Course;
    #theme: number;
    #lastModified: Date;
    #status: Status;

    constructor(data: EssayInterface) {
        this.#id = data.id;
        this.#course = data.course;
        this.#file = data.file;
        this.#student = data.student;
        this.#theme = data.theme;
        this.#lastModified = data.lastModified;
        this.#status = data.status;
    }

    get id() { return this.#id }

    get file() { return this.#file }
    set file(value: string) {
        this.#file = value;
        this.updateLastModified();
    }

    get student() { return this.#student }
    set student(value: number) {
        this.#student = value;
        this.updateLastModified();
    }

    get course() { return this.#course }
    set course(value: Course) {
        this.#course = value;
        this.updateLastModified();
    }

    get theme() { return this.#theme }
    set theme(value: number) {
        this.#theme = value;
        this.updateLastModified();
    }

    get lastModified() { return this.#lastModified }

    get status() { return this.#status }
    set status(value: Status) {
        this.#status = value;
        this.updateLastModified();
    }

    private updateLastModified() { this.#lastModified = new Date(); }

}