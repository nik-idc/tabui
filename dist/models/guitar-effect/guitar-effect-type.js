/**
 * All the supported guitar effects
 */
export var GuitarEffectType;
(function (GuitarEffectType) {
    GuitarEffectType[GuitarEffectType["Bend"] = 0] = "Bend";
    GuitarEffectType[GuitarEffectType["BendAndRelease"] = 1] = "BendAndRelease";
    GuitarEffectType[GuitarEffectType["Prebend"] = 2] = "Prebend";
    GuitarEffectType[GuitarEffectType["PrebendAndRelease"] = 3] = "PrebendAndRelease";
    GuitarEffectType[GuitarEffectType["Vibrato"] = 4] = "Vibrato";
    GuitarEffectType[GuitarEffectType["Slide"] = 5] = "Slide";
    GuitarEffectType[GuitarEffectType["HammerOnOrPullOff"] = 6] = "HammerOnOrPullOff";
    GuitarEffectType[GuitarEffectType["PinchHarmonic"] = 7] = "PinchHarmonic";
    GuitarEffectType[GuitarEffectType["NaturalHarmonic"] = 8] = "NaturalHarmonic";
    GuitarEffectType[GuitarEffectType["PalmMute"] = 9] = "PalmMute";
})(GuitarEffectType || (GuitarEffectType = {}));
//# sourceMappingURL=guitar-effect-type.js.map