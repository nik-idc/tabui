import { Note } from "./note";
export declare class Guitar {
    readonly stringsCount: number;
    /**
     * Guitar tuning. IMPORTANT: the first element should be the first string tuning
     */
    readonly tuning: Note[];
    readonly fretsCount: number;
    constructor(stringsCount?: number, 
    /**
     * Guitar tuning. IMPORTANT: the first element should be the first string tuning
     */
    tuning?: Note[], fretsCount?: number);
    getTuningStr(): string;
    static fromObject(obj: any): Guitar;
}
