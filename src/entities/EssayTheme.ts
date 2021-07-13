export type Course = "esa" | "espcex" | "blank";

export interface EssayThemeInterface {
    id: number;
    title: string;
    startDate: Date;
    endDate: Date;
    lastModified: Date;
    helpText: string;
    file: string;
    courses: Set<Course>;
    deactivated: boolean;
}

export interface EssayUpdate {
    title?: string;
    startDate?: Date;
    endDate?: Date;
    lastModified?: Date;
    helpText?: string;
    file?: string;
    courses?: Set<Course>;
    deactivated?: boolean;
}

export default class EssayTheme implements EssayThemeInterface {
    readonly #id: number;
    #title: string;
    #startDate: Date;
    #endDate: Date;
    #lastModified: Date;
    #helpText: string;
    #file: string;
    #courses: Set<Course>;
    #deactivated: boolean;

    constructor(data: EssayThemeInterface) {
        this.#id = data.id;
        this.#title = data.title;
        this.#startDate = data.startDate;
        this.#endDate = data.endDate;
        this.#lastModified = data.lastModified;
        this.#helpText = data.helpText;
        this.#file = data.file;
        this.#courses = new Set(data.courses);
        this.#deactivated = data.deactivated;
    }

    get data() {
        return {
            id: this.#id,
            title: this.#title,
            startDate: this.#startDate,
            endDate: this.#endDate,
            lastModified: this.#lastModified,
            helpText: this.#helpText,
            file: this.#file,
            courses: this.#courses,
            deactivated: this.#deactivated,
        };
    }

    get id() { return this.#id; }

    get title() { return this.#title; }
    set title(value: string) {
        this.#title = value;
        this.#lastModified = new Date();
        this.updateLastModified();
    }

    get active() {
        const now = new Date();
        return (now >= this.#startDate && now < this.#endDate) && !this.#deactivated;
    }

    get startDate() { return this.#startDate; }
    set startDate(value: Date) {
        if (this.startDate > new Date()) {
            this.#startDate = value;
            this.updateLastModified();
        }
    }

    get endDate() { return this.#endDate; }
    set endDate(value: Date) {
        this.#endDate = value;
        this.updateLastModified();
    }

    get lastModified() { return this.#lastModified; }

    get helpText() { return this.#helpText; }
    set helpText(value: string) {
        this.#helpText = value;
        this.updateLastModified();
    }

    get file() { return this.#file; }
    set file(value: string) {
        this.#file = value;
        this.updateLastModified();
    }

    get courses() { return this.#courses; }
    set courses(value: Set<Course>) {
        this.#courses = value;
        this.updateLastModified();
    }

    get deactivated() { return this.#deactivated; }
    set deactivated(value: boolean) {
        this.#deactivated = value;
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
        this.#deactivated = data.deactivated || this.#deactivated;
        this.#startDate = data.startDate || this.#startDate;
        this.updateLastModified();
    }

    public async removeCourse(value: Course) {
        this.courses.delete(value);
        this.updateLastModified();
    }

    public async addCourse(value: Course) {
        this.courses.add(value);
        this.updateLastModified();
    }
}