/**
 * All the kinds of guitar effects
 */
export var GuitarEffectScope;
(function (GuitarEffectScope) {
    /**
     * Note-level effect, applies to a single note
     */
    GuitarEffectScope[GuitarEffectScope["NoteLevelEffect"] = 0] = "NoteLevelEffect";
    /**
     * Phrase-level effect, applies to a group of notes
     */
    GuitarEffectScope[GuitarEffectScope["PhraseLevelEffect"] = 1] = "PhraseLevelEffect";
})(GuitarEffectScope || (GuitarEffectScope = {}));
//# sourceMappingURL=guitar-effect-scope.js.map