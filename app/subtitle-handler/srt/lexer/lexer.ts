import { Readable } from "stream";
import { CharReader } from "../parser/char-reader";
import { isDigit, isMacLineEnding, isNewline, isSpace, isUnixLineEnding, isWindowsLineEnding } from "../../string-util";

export enum TokenType {
    SPACE,
    NUMBER,

    COLON,
    DOT_OR_COMMA, // . and , example: 00:01:23*,*456 or 00:01:23*.*456
    TIME_ARROW, // -->
    TEXT,
    NEWLINE, // cue line break or empty line

    EOF
}

export class Token {
    public type: TokenType;
    public value: string | null = null;

    /**
     * 
     * @param type - token type
     * @param value - if token has fixed value (like COLON, TIME_ARROW), value should be omitted
     * DOT_OR_COMMA, NEW
     */
    constructor(type: TokenType, value: string | null = null) {
        this.type = type;
        switch (type) {
            case TokenType.COLON:
                this.value = ':';
                break;
            case TokenType.TIME_ARROW:
                this.value = '-->';
                break;
            case TokenType.NEWLINE:
                this.value = '\r\n';
                break;
            default:
                this.value = value;
        }
    }
}

export class Lexer {
    private charReader: CharReader;
    constructor(readStream: Readable) {
        this.charReader = new CharReader(readStream);
    }

    public async getToken(): Promise<Token> {
        let lastChar = await this.charReader.peek();
        
        while (isSpace(lastChar)) {
            let spaceStr:string = '';
            do {
                spaceStr += lastChar;
                await this.charReader.next();
                lastChar = await this.charReader.peek();
            } while (isSpace(lastChar));
            return new Token(TokenType.SPACE, spaceStr);
        }

        if (isWindowsLineEnding(lastChar, await this.charReader.peek(1))) {
            await this.charReader.next();
            await this.charReader.next();
            return new Token(TokenType.NEWLINE);
        } else if (isMacLineEnding(lastChar)) {    
            await this.charReader.next();
            return new Token(TokenType.NEWLINE);
        } else if (isUnixLineEnding(lastChar)) {
            await this.charReader.next();
            return new Token(TokenType.NEWLINE);
        }

        if (isDigit(lastChar)) {
            let numberStr = '';
            do {
                numberStr += lastChar;
                await this.charReader.next();
                lastChar = await this.charReader.peek();
            } while (isDigit(lastChar));
            return new Token(TokenType.NUMBER, numberStr);
        }

        if (this.isColon(lastChar)) {
            await this.charReader.next();
            return new Token(TokenType.COLON);
        }
        
        if (this.isDotOrComma(lastChar)) {
            await this.charReader.next();
            return new Token(TokenType.DOT_OR_COMMA, lastChar);
        }

        if (this.isPossibleTimeArrowStart(lastChar) && await this.isNextTokenTimeArrow()) {
            await this.charReader.next();
            await this.charReader.next();
            await this.charReader.next();
            return new Token(TokenType.TIME_ARROW);
        }

        if (this.isEOF(lastChar)) {
            return new Token(TokenType.EOF);
        } else {
            // TEXT
            let text: string = '';
            do {
                text += lastChar;
                await this.charReader.next();
                lastChar = await this.charReader.peek();
            } while (!await this.isTokenOutsideText(lastChar));
            return new Token(TokenType.TEXT, text);
        }
    }

    private async isNextTokenTimeArrow(): Promise<boolean> {
        const firstChar = await this.charReader.peek()
        const secondChar = await this.charReader.peek(1)
        const thirdChar = await this.charReader.peek(2)
        return firstChar === '-' && secondChar === '-' && thirdChar === '>';
    }

    private isDotOrComma(char: string | null): boolean {
        return char === '.' || char === ',';
    }

    private isColon(char: string | null): boolean {
        return char === ':';
    }

    private isPossibleTimeArrowStart(char: string | null): boolean {
        return char === '-';
    }

    private isEOF(char: string | null): boolean {
        return char === null;
    }   

    /**
     * 
     * @returns 当前文本后续会不会组成文本外的token
     */
    private async isTokenOutsideText(char: string | null): Promise<boolean> {
        if (isSpace(char) ) { return true; }
        if (isNewline(char)) { return true; }
        if (isDigit(char)) { return true; }
        if (this.isColon(char)) { return true; }
        if (this.isDotOrComma(char)) { return true; }
        if (this.isPossibleTimeArrowStart(char) && await this.isNextTokenTimeArrow()) { return true; }
        if (this.isEOF(char)) { return true; }
        return false;
    }
}
