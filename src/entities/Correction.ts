
export interface CorrectionInterface {
    id: number;
    essay: number;
    correctionDate: Date;
    isReadable: boolean;
    hasMarginSpacing: boolean;
    obeyedMargins: boolean;
    erased: boolean;
    orthography: boolean;
    accentuation: boolean;
    agreement: boolean;
    repeated: boolean;
    veryShortSentences: boolean;
    understoodTheme: boolean;
    followedGenre: boolean;
    cohesion: boolean;
    organized: boolean;
    conclusion: boolean;
    comment: string;
    points: number;
}


export default class Correction implements CorrectionInterface {
    readonly #id: number;
    readonly #essay: number;
    readonly #correctionDate: Date;
    public isReadable: boolean;
    public hasMarginSpacing: boolean;
    public obeyedMargins: boolean;
    public erased: boolean;
    public orthography: boolean;
    public accentuation: boolean;
    public agreement: boolean;
    public repeated: boolean;
    public veryShortSentences: boolean;
    public understoodTheme: boolean;
    public followedGenre: boolean;
    public cohesion: boolean;
    public organized: boolean;
    public conclusion: boolean;
    public comment: string;
    public points: number;

    constructor(data: CorrectionInterface) {
        this.#id = data.id;
        this.#essay = data.essay;
        this.#correctionDate = data.correctionDate;
        this.isReadable = data.isReadable;
        this.hasMarginSpacing = data.hasMarginSpacing;
        this.obeyedMargins = data.obeyedMargins;
        this.erased = data.erased;
        this.orthography = data.orthography;
        this.accentuation = data.accentuation;
        this.agreement = data.agreement;
        this.repeated = data.repeated;
        this.veryShortSentences = data.veryShortSentences;
        this.understoodTheme = data.understoodTheme;
        this.followedGenre = data.followedGenre;
        this.cohesion = data.cohesion;
        this.organized = data.organized;
        this.conclusion = data.conclusion;
        this.comment = data.comment;
        this.points = data.points;
    }

    get id() { return this.#id }

    get essay() { return this.#essay }

    get correctionDate() { return this.#correctionDate }

}