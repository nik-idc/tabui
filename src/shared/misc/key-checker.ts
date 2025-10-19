export class KeyChecker {
  static isNumber(key: string): boolean {
    return "1234567890".includes(key);
  }

  static isArrow(key: string): boolean {
    return (
      key == "ArrowDown" ||
      key == "ArrowUp" ||
      key == "ArrowRight" ||
      key == "ArrowLeft"
    );
  }

  static isBackspace(key: string): boolean {
    return key == "Backspace";
  }

  static isDel(key: string): boolean {
    return key == "Delete";
  }

  static isLetter(key: string): boolean {
    return true;
  }
}
