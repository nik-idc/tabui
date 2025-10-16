/**
 * Class that represents guitar effect options
 */
export class GuitarEffectOptions {
    bendPitch;
    bendReleasePitch;
    prebendPitch;
    nextHigher;
    /**
     * Class that represents guitar effect options
     * @param bendPitch Bend pitch
     * @param bendReleasePitch Bend release pitch
     * @param prebendPitch Prebend pitch
     * @param nextHigher True if slide/HO-PO into a higher note, false otherwise
     */
    constructor(bendPitch, bendReleasePitch, prebendPitch, nextHigher) {
        this.bendPitch = bendPitch;
        this.bendReleasePitch = bendReleasePitch;
        this.prebendPitch = prebendPitch;
        this.nextHigher = nextHigher;
    }
    /**
     * Parse from object
     * @param obj Object
     * @returns Parsed guitar effect options
     */
    static fromObject(obj) {
        return new GuitarEffectOptions(obj.bendPitch, obj.bendReleasePitch, obj.prebendPitch);
    }
}
//# sourceMappingURL=guitar-effect-options.js.map