
export type Course = "esa" | "espcex"

export interface EssayThemeInterface {
    id: number;
    title: string;
    startDate: Date;
    endDate: Date;
    lastModified: Date;
    helpText: string;
    file: string;
    courses: Course[];
}

export interface EssayUpdate {
    title?: string;
    startDate?: Date;
    endDate?: Date;
    lastModified?: Date;
    helpText?: string;
    file?: string;
    courses?: Course[];
}

export default class EssayTheme implements EssayThemeInterface {
    #id: number;
    #title: string;
    #startDate: Date;
    #endDate: Date;
    #lastModified: Date;
    #helpText: string;
    #file: string;
    #courses: Course[];

    constructor(data: EssayThemeInterface) {
        this.#id = data.id;
        this.#title = data.title;
        this.#startDate = data.startDate;
        this.#endDate = data.endDate;
        this.#lastModified = data.lastModified;
        this.#helpText = data.helpText;
        this.#file = data.file;
        this.#courses = data.courses;
    }

    get id() { return this.#id }

    get title() { return this.#title }
    set title(value: string) {
        this.#title = value;
        this.#lastModified = new Date();
        this.updateLastModified();
    }

    get active() { return this.#endDate <= new Date() }

    get startDate() { return this.#startDate }
    set startDate(value: Date) {
        if (this.startDate > new Date()) {
            this.#startDate = value;
            this.updateLastModified();
        }
    }

    get endDate() { return this.#endDate }
    set endDate(value: Date) {
        this.#endDate = value;
        this.updateLastModified();
    }

    get lastModified() { return this.#lastModified }

    get helpText() { return this.#helpText }
    set helpText(value: string) {
        this.#helpText = value;
        this.updateLastModified();
    }

    get file() { return this.#file }
    set file(value: string) {
        this.#file = value;
        this.updateLastModified();
    }

    get courses() { return this.#courses }
    set courses(value: Course[]) {
        this.#courses = value;
        this.updateLastModified();
    }

    private updateLastModified() {
        this.#lastModified = new Date();
    }

    public async update(data: EssayUpdate) {
        this.#title = data.title || this.#title;
        this.#endDate = data.endDate || this.#endDate;
        this.#lastModified = data.lastModified || this.#lastModified;
        this.#helpText = data.helpText || this.#helpText;
        this.#file = data.file || this.#file;
        this.#courses = data.courses || this.#courses;
        if(data.startDate) this.startDate = data.startDate;
        this.updateLastModified();
    }

    public addCourse(value: Course) {
        this.courses.push(value);
        this.updateLastModified();
    }
}