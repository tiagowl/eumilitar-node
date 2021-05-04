import EssayTheme, { Course, EssayThemeInterface } from "../entities/EssayTheme";
import UseCase from "./UseCase";

export interface EssayThemeFilter {
    id?: number;
    title?: string;
    startDate?: Date;
    endDate?: Date;
    lastModified?: Date;
    helpText?: string;
    file?: string;
    courses?: Set<Course>;
}

export interface EssayThemeCreation {
    title: string;
    startDate: Date;
    endDate: Date;
    helpText: string;
    file: File;
    courses: Set<Course>;
}

export default class EssayThemeCase extends UseCase<EssayTheme, EssayThemeFilter> {

    public create(data: EssayThemeCreation) {

    }

}