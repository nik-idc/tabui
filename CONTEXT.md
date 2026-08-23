# TabUI Notation

TabUI models and renders editable guitar notation.

## Language

**Rhythm row**:
A visual row below a staff that contains one voice's durations, beams, and
tuplets. Bars on the same staff line share one vertical row position per
non-empty voice.

**Note transition**:
A guitar technique from a source note to a compatible target note. In TabUI,
the target is the immediate next beat's note on the same voice and string.
_Avoid_: Relation target, spanner, slur
