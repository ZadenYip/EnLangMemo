import { Readable } from "stream";
import { Lexer, Token, TokenType } from "../lexer/lexer";

abstract class ASTNode {}

export class CueAST extends ASTNode {
    constructor(
        public sequence: number, 
        public startTime: TimestampAST,
        public endTime: TimestampAST,
        public textLines: string[]) {
        super();
    }
}

export class TimestampAST extends ASTNode {
    constructor(
        public hours: number,
        public minutes: number,
        public seconds: number,
        public milliseconds: number
    ) {
        super();
    }
}

class TokenStream {
    private lexer: Lexer;
    private current: Token;
    
    constructor(stream: Readable) {
        this.lexer = new Lexer(stream);
        // temporary initialization, will be replaced in the first consume call
        this.current = new Token(TokenType.EOF);
    }

    peek(): Token {
        return this.current;
    }

    async start(): Promise<void> {
        this.current = await this.lexer.getToken();
    }

    /**
     * consume current token and advance to next token
     * @returns consumed token
     */
    async consume(): Promise<Token> {
        const previous = this.current;
        this.current = await this.lexer.getToken();
        return previous;
    }

    /**
     * 
     * @param expectedType
     * @returns if expctedType matches current token, consume and return it; otherwise throw error
     */
    async eatExpect(expectedType: TokenType): Promise<Token> {
        const token = this.peek();
        if (token.type !== expectedType) {
            throw new ParseError(`Expected ${TokenType[expectedType]}, got ${TokenType[token.type]}`);
        }
        return await this.consume();
    }
}

export class Parser {
    private tokenStream: TokenStream;

    constructor(stream: Readable) {
        this.tokenStream = new TokenStream(stream);
    }

    public static createParser(stream: Readable): AsyncIterable<CueAST> {
        const parser = new Parser(stream);
        return Readable.from(parser.startParsing());
    }

    private async *startParsing(): AsyncGenerator<CueAST> {
        try {
            await this.tokenStream.start();
            let currentToken = this.tokenStream.peek();
            while (true) {
                // skip tokens until we find a NUMBER token (cue sequence) or EOF
                while (currentToken.type !== TokenType.NUMBER && currentToken.type !== TokenType.EOF) {
                    currentToken = await this.tokenStream.consume();
                    currentToken = this.tokenStream.peek();
                }

                // if EOF, end parsing
                if (currentToken.type === TokenType.EOF) {
                    break;
                } else {
                    // NUMBER token found, try to parse cue
                    const cue = await this.parseCue();
                    yield cue;
                    currentToken = this.tokenStream.peek();
                }
            }
            return;
        } catch (err) {
            throw err;
        }
    }

    private async parseCue(): Promise<CueAST> {
        const sequenceToken = await this.tokenStream.eatExpect(TokenType.NUMBER);
        const sequence = parseInt(sequenceToken.value!);
        await this.tokenStream.eatExpect(TokenType.NEWLINE);

        const startTime = await this.parseTimestamp();
        await this.tokenStream.eatExpect(TokenType.SPACE);
        const arrowToken = await this.tokenStream.eatExpect(TokenType.TIME_ARROW);
        await this.tokenStream.eatExpect(TokenType.SPACE);
        const endTime = await this.parseTimestamp();
        await this.tokenStream.eatExpect(TokenType.NEWLINE);

        const textLines = await this.parseLinesFromText();

        return new CueAST(sequence, startTime, endTime, textLines);
    }

     private async parseTimestamp(): Promise<TimestampAST> {
        const hoursToken = await this.tokenStream.eatExpect(TokenType.NUMBER);
        const hours = parseInt(hoursToken.value!);
        await this.tokenStream.eatExpect(TokenType.COLON);

        const minutesToken = await this.tokenStream.eatExpect(TokenType.NUMBER);
        const minutes = parseInt(minutesToken.value!);
        await this.tokenStream.eatExpect(TokenType.COLON);
        const secondsToken = await this.tokenStream.eatExpect(TokenType.NUMBER);
        const seconds = parseInt(secondsToken.value!);
        await this.tokenStream.eatExpect(TokenType.DOT_OR_COMMA);

        const millisecondsToken = await this.tokenStream.eatExpect(TokenType.NUMBER);
        const milliseconds = parseInt(millisecondsToken.value!);

        return new TimestampAST(hours, minutes, seconds, milliseconds);
    }

    private async parseLinesFromText(): Promise<string[]> {
        const textLines: string[] = [];
        let line = '';
        let currentToken = this.tokenStream.peek();
        
        while (currentToken.type !== TokenType.EOF) {
            const text = currentToken.value!;
            if (currentToken.type === TokenType.NEWLINE) {
                textLines.push(line);
                line = '';
                await this.tokenStream.eatExpect(TokenType.NEWLINE);

                // check if next token is also NEWLINE (empty line between cues)
                currentToken = this.tokenStream.peek();
                if (currentToken.type === TokenType.NEWLINE) {
                    break;
                }
            }
            else {
                line += text;
                await this.tokenStream.consume();
                currentToken = this.tokenStream.peek();
            }
        }

        if (line.length > 0) {
            textLines.push(line);
        }
        
        return textLines;
    }
}

class ParseError extends Error {
    constructor (msg: string) {
        super(msg);
        this.name = "ParseError";
    }
}