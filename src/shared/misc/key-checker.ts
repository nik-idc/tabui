export class KeyChecker {
  static isNumber(key: string): boolean {
    return "1234567890".includes(key);
  }

  static isArrow(key: string): boolean {
    return (
      key == "arrowdown" ||
      key == "arrowup" ||
      key == "arrowright" ||
      key == "arrowleft"
    );
  }

  static isBackspace(key: string): boolean {
    return key == "backspace";
  }

  static isDel(key: string): boolean {
    return key == "delete";
  }

  static isLetter(key: string): boolean {
    return true;
  }
}
