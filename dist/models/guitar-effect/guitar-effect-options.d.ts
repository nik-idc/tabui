/**
 * Class that represents guitar effect options
 */
export declare class GuitarEffectOptions {
    readonly bendPitch?: number | undefined;
    readonly bendReleasePitch?: number | undefined;
    readonly prebendPitch?: number | undefined;
    readonly nextHigher?: boolean | undefined;
    /**
     * Class that represents guitar effect options
     * @param bendPitch Bend pitch
     * @param bendReleasePitch Bend release pitch
     * @param prebendPitch Prebend pitch
     * @param nextHigher True if slide/HO-PO into a higher note, false otherwise
     */
    constructor(bendPitch?: number | undefined, bendReleasePitch?: number | undefined, prebendPitch?: number | undefined, nextHigher?: boolean | undefined);
    /**
     * Parse from object
     * @param obj Object
     * @returns Parsed guitar effect options
     */
    static fromObject(obj: any): GuitarEffectOptions;
}
