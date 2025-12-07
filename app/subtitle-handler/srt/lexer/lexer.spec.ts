import { Readable } from "stream";
import { Lexer, Token, TokenType } from "./lexer";


describe("Lexer", () => {

    describe("SPACE tokens", () => {
        it("should tokenize spaces correctly", async () => {
            const input = "    \t  ";
            const stream: Readable = Readable.from([input]);
            const lexer = new Lexer(stream);
            const expectedTokens: Token[] = [
                new Token(TokenType.SPACE, "    \t  "),
                new Token(TokenType.EOF)
            ];
            await expectTokens(lexer, expectedTokens);
        });

        it("should tokenize spaces and text correctly", async () => {
            const input = "  hello\tworld  ";
            const stream: Readable = Readable.from([input]);
            const lexer = new Lexer(stream);
            const expectedTokens: Token[] = [
                new Token(TokenType.SPACE, "  "),
                new Token(TokenType.TEXT, "hello"),
                new Token(TokenType.SPACE, "\t"),
                new Token(TokenType.TEXT, "world"),
                new Token(TokenType.SPACE, "  "),
                new Token(TokenType.EOF)
            ];
            await expectTokens(lexer, expectedTokens);
        });
    });

    describe("NEWLINE tokens", () => {
        // different OSs have different newline formats
        // That is, Windows uses \r\n, Linux uses \n, Mac uses \r
        it("should tokenize different newline formats correctly", async () => {
            const input = "line1\r\nline2\nline3\r";
            const stream: Readable = Readable.from([input]);
            const lexer = new Lexer(stream);
            const expectedTokens: Token[] = [
                new Token(TokenType.TEXT, "line"),
                new Token(TokenType.NUMBER, "1"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.TEXT, "line"),
                new Token(TokenType.NUMBER, "2"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.TEXT, "line"),
                new Token(TokenType.NUMBER, "3"),
                new Token(TokenType.NEWLINE),   
                new Token(TokenType.EOF)
            ];
            await expectTokens(lexer, expectedTokens);
        });

        it("should tokenize mixed newlines correctly", async () => {
            const input = "line0\r\nline1\nline2\r\n";
            const stream: Readable = Readable.from([input]);
            const lexer = new Lexer(stream);
            const expectedTokens: Token[] = [
                new Token(TokenType.TEXT, "line"),
                new Token(TokenType.NUMBER, "0"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.TEXT, "line"),
                new Token(TokenType.NUMBER, "1"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.TEXT, "line"),
                new Token(TokenType.NUMBER, "2"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.EOF)
            ];
            await expectTokens(lexer, expectedTokens);
        });
    });

    describe("NUMBER tokens", () => {
        it("should tokenize numbers correctly", async () => {
            const input = "123 456";
            const stream: Readable = Readable.from([input]);
            const lexer = new Lexer(stream);

            const expectedTokens: Token[] = [
                new Token(TokenType.NUMBER, "123"),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.NUMBER, "456"),
                new Token(TokenType.EOF)
            ];
            await expectTokens(lexer, expectedTokens);
        });
    });

    describe("TEXT tokens", () => {
        it("should tokenize text correctly", async () => {
            const input = "hello world";
            const stream: Readable = Readable.from([input]);
            const lexer = new Lexer(stream);
            const expectedTokens: Token[] = [
                new Token(TokenType.TEXT, "hello"),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.TEXT, "world"),
                new Token(TokenType.EOF)
            ];
            await expectTokens(lexer, expectedTokens);
        });
    });

    describe("TIME_ARROW & Timecode tokens", () => {
        it("should tokenize timecode in colon format correctly", async () => {
            const input = "00:01:23,456 --> 00:01:25,678";
            const stream: Readable = Readable.from([input]);
            const lexer = new Lexer(stream);
            const expectedTokens: Token[] = [
                new Token(TokenType.NUMBER, "00"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "01"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "23"),
                new Token(TokenType.DOT_OR_COMMA, ","),
                new Token(TokenType.NUMBER, "456"),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.TIME_ARROW),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.NUMBER, "00"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "01"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "25"),
                new Token(TokenType.DOT_OR_COMMA, ","),
                new Token(TokenType.NUMBER, "678"),
                new Token(TokenType.EOF)
            ];
            
            await expectTokens(lexer, expectedTokens);
        });

        it("should tokenize timecode in dot format correctly", async () => {
            const input = "00:01:23.456 --> 00:01:25.678";
            const stream: Readable = Readable.from([input]);
            const lexer = new Lexer(stream);
            const expectedTokens: Token[] = [
                new Token(TokenType.NUMBER, "00"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "01"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "23"),
                new Token(TokenType.DOT_OR_COMMA, "."),
                new Token(TokenType.NUMBER, "456"),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.TIME_ARROW),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.NUMBER, "00"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "01"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "25"),
                new Token(TokenType.DOT_OR_COMMA, "."),
                new Token(TokenType.NUMBER, "678"),
                new Token(TokenType.EOF)
            ];
            
            await expectTokens(lexer, expectedTokens);
        });
    });

    describe("Mixed tokens", () => {
        it("should treat spaced dashes as TEXT, not TIME_ARROW", async () => {
            const input = "-- >";
            const stream: Readable = Readable.from([input]);
            const lexer = new Lexer(stream);
            const expectedTokens: Token[] = [
                new Token(TokenType.TEXT, "--"),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.TEXT, ">"),
                new Token(TokenType.EOF)
            ];
            await expectTokens(lexer, expectedTokens);
        });

        it("should tokenize mixed input correctly", async () => {
            const input = '1\r\n00:22:20,700 --> 00:22:23,230\r\n不被谁人影响 也无法成为他人\r\n' +
            '2\r\n00:22:23,780 --> 00:22:26,300\r\n曾以为只是梦境 试着置之一笑';
            const stream: Readable = Readable.from([input], { encoding: 'utf-8' });
            const lexer = new Lexer(stream);
            const expectedTokens: Token[] = [
                new Token(TokenType.NUMBER, "1"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.NUMBER, "00"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "22"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "20"),
                new Token(TokenType.DOT_OR_COMMA, ","),
                new Token(TokenType.NUMBER, "700"),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.TIME_ARROW),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.NUMBER, "00"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "22"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "23"),
                new Token(TokenType.DOT_OR_COMMA, ","),
                new Token(TokenType.NUMBER, "230"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.TEXT, "不被谁人影响"),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.TEXT, "也无法成为他人"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.NUMBER, "2"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.NUMBER, "00"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "22"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "23"),
                new Token(TokenType.DOT_OR_COMMA, ","),
                new Token(TokenType.NUMBER, "780"),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.TIME_ARROW),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.NUMBER, "00"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "22"),
                new Token(TokenType.COLON, ":"),
                new Token(TokenType.NUMBER, "26"),
                new Token(TokenType.DOT_OR_COMMA, ","),
                new Token(TokenType.NUMBER, "300"),
                new Token(TokenType.NEWLINE),
                new Token(TokenType.TEXT, "曾以为只是梦境"),
                new Token(TokenType.SPACE, " "),
                new Token(TokenType.TEXT, "试着置之一笑"),
                new Token(TokenType.EOF)
            ];
            await expectTokens(lexer, expectedTokens);
        });
    });

});

async function expectTokens(lexer: Lexer, expected: Token[]) {
    const actualTokens: Token[] = [];

    for (let i = 0; i < expected.length; i++) {
        const token: Token = await lexer.getToken();
        actualTokens.push(token);
    }

    expect(actualTokens).toEqual(expected);
}
