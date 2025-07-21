export class NoteDefCallbacks {
  onNoteClick(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number,
    noteElementId: number
  ): void {
    this._tabWindow.selectNoteElementUsingIds(
      tabLineElementId,
      barElementId,
      beatElementId,
      noteElementId
    );
  }
}
