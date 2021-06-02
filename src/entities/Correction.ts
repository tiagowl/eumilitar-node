
export interface CorrectionInterface {
    id: number;
    essay: number;
    correctionDate: Date;
    isReadable: string;
    hasMarginSpacing: string;
    obeyedMargins: string;
    erased: string;
    orthography: string;
    accentuation: string;
    agreement: string;
    repeated: string;
    veryShortSentences: string;
    understoodTheme: string;
    followedGenre: string;
    cohesion: string;
    organized: string;
    conclusion: string;
    comment: string;
    points: number;
}


export default class Correction implements CorrectionInterface {
    readonly #id: number;
    readonly #essay: number;
    readonly #correctionDate: Date;
    public isReadable: string;
    public hasMarginSpacing: string;
    public obeyedMargins: string;
    public erased: string;
    public orthography: string;
    public accentuation: string;
    public agreement: string;
    public repeated: string;
    public veryShortSentences: string;
    public understoodTheme: string;
    public followedGenre: string;
    public cohesion: string;
    public organized: string;
    public conclusion: string;
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

    get id() { return this.#id; }

    get essay() { return this.#essay; }

    get correctionDate() { return this.#correctionDate; }

}