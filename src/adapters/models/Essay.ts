import { Knex } from "knex";
import { EssayInsertionData, EssayRepositoryInterface } from "../../cases/EssayCase";
import { EssayThemeRepositoryInterface } from "../../cases/EssayThemeCase";
import Essay, { EssayInterface, Status } from "../../entities/Essay";
import { Course } from "../../entities/EssayTheme";
import EssayThemeRepository from "./EssayTheme";

export interface EssayModel extends EssayInsertion {
    essay_id: number;
    last_modified: Date;
    sent_date: Date;
    local: boolean;
}

export interface EssayInsertion {
    file_name: string;
    file_url: string;
    file_path: string;
    user_id: number;
    course_tag: number;
    theme: number;
    status: Status;
}

export const EssayService = (driver: Knex) => driver<Partial<EssayModel>, EssayModel>('essays');

const courseMap: [number, Course][] = [
    [2, 'esa'],
    [3, 'espcex'],
]

export class EssayRepository implements EssayRepositoryInterface {
    private driver: Knex;
    themes: EssayThemeRepositoryInterface;

    constructor(driver: Knex) {
        this.driver = driver;
        this.themes = new EssayThemeRepository(driver);
    }

    private async parseToDB(data: Partial<EssayInterface>): Promise<EssayInsertion | Partial<EssayModel>> {
        const entries = Object.entries(data);
        return entries.reduce((obj, field) => {
            return obj;
        }, {} as EssayInsertion | Partial<EssayModel>)
    }

    private async parseFromDB(data: EssayModel) {
        const course = courseMap.find(item => item[0] === data.course_tag) as [number, Course]
        return new Essay({
            id: data.user_id,
            file: data.file_url,
            student: data.user_id,
            course: course[1],
            theme: data.theme,
            status: data.status,
            lastModified: data.last_modified,
            sendDate: data.sent_date,
        })
    }

    public async get(filter: Partial<EssayInterface>) {
        const service = EssayService(this.driver);
        const parsedFilter = await this.parseToDB(filter);
        const essayData = await service.where(parsedFilter).first();
        if (!essayData) return undefined;
        return this.parseFromDB(essayData);
    }

    public async create(data: EssayInsertionData) {
        const service = EssayService(this.driver);
        const parsed = await this.parseToDB(data);
        const created = await service.insert(parsed);
        const id = created[0];
        const check = await this.get({ id });
        if(!check) throw new Error('Falha ao gravar no banco de dadodos');
        return check;
    }

}