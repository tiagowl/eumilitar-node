import { Course } from './EssayTheme';


export type Status = "invalid" | "pending" | "revised" | "correcting";

export const status: Status[] = ['invalid', 'pending', 'revised', 'correcting'];

export interface EssayInterface {
    id: number;
    file: string;
    student: number;
    course: Course;
    theme: number;
    lastModified: Date;
    status: Status;
    sendDate: Date;
    corrector?: number | null;
}

export default class Essay implements EssayInterface {
    readonly #id: number;
    #file: string;
    #student: number;
    #course: Course;
    #theme: number;
    #lastModified: Date;
    #status: Status;
    readonly #sendDate: Date;
    #corrector?: number | null;


    constructor(data: EssayInterface) {
        this.#id = data.id;
        this.#course = data.course;
        this.#file = data.file;
        this.#student = data.student;
        this.#theme = data.theme;
        this.#lastModified = data.lastModified;
        this.#status = data.status;
        this.#sendDate = data.sendDate;
        this.#corrector = data.corrector;
    }

    get data(): EssayInterface {
        return {
            id: this.#id,
            course: this.#course,
            file: this.#file,
            student: this.#student,
            theme: this.#theme,
            lastModified: this.#lastModified,
            status: this.#status,
            sendDate: this.#sendDate,
            corrector: this.#corrector,
        }
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

    get sendDate() { return this.#sendDate }

    get corrector(): number | null | undefined { return this.#corrector }
    set corrector(value: number | null | undefined) {
        if (typeof this.#corrector === 'undefined' && typeof value === 'number') {
            this.#status = 'correcting';
        } else if (typeof this.#corrector === 'number' && typeof value === 'undefined') {
            this.#status = 'pending';
        }
        this.#corrector = value;
        this.updateLastModified();
    }

    private updateLastModified() { this.#lastModified = new Date(); }

}