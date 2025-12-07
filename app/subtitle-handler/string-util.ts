export function isDigit(char: string | null): boolean {
    const regex: RegExp = /\d/;
    return regex.test(char || '');
}

/**
 * Checks if the given character is a space or a tab.
 * @param char - character
 * @returns true if the character is a space or a tab, false otherwise
 */
export function isSpace(char: string | null): boolean {
    return char === ' ' || char === '\t';
}

export function isNewline(char: string | null): boolean {
    return char === '\n' || char === '\r';
}

export function isMacLineEnding(char: string | null): boolean {
    return char === '\r';
}

export function isUnixLineEnding(char: string | null): boolean {
    return char === '\n';
}

export function isWindowsLineEnding(char: string | null, nextChar: string | null): boolean {
    return char === '\r' && nextChar === '\n';
}