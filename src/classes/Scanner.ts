import Lox from './Lox';
import Token from './types/Token';
import { TokenType } from './types/TokenType';

export default class Scanner {
    source: string;
    tokens: Token[] = [];
    start: number = 0;
    current: number = 0
    line: number = 1;
    keywords: { [key: string]: TokenType } = {
        "and": TokenType.AND,
        "class": TokenType.CLASS,
        "else": TokenType.ELSE,
        "false": TokenType.FALSE,
        "for": TokenType.FOR,
        "fun": TokenType.FUN,
        "if": TokenType.IF,
        "nil": TokenType.NIL,
        "or": TokenType.OR,
        "print": TokenType.PRINT,
        "return": TokenType.RETURN,
        "super": TokenType.SUPER,
        "this": TokenType.THIS,
        "true": TokenType.TRUE,
        "var": TokenType.VAR,
        "while": TokenType.WHILE,
    };

    constructor(source) {
        this.source = source;
    }

    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(TokenType.EOF, '', null, this.line));
        return this.tokens;
    }

    isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    scanToken() {
        const c = this.advance();
        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*': this.addToken(TokenType.STAR); break;
            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            case '/':
                if (this.match('/')) {
                    // A comment goes until the end of the line.
                    while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;
            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespace.
                break;
            case '\n':
                this.line++;
                break;
            case '"': this.string(); break;
            default:
                if (this.isDigit(c)){
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    Lox.error(this.line, 'Unexpected character');
                }
                break;
        }
    }

    identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();

        const text = this.source.substring(this.start, this.current);
        const type = this.keywords[text] || TokenType.IDENTIFIER;
        this.addToken(type);
    }

    string() {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() === '\n') this.line++;
            this.advance();
        }

        if (this.isAtEnd()) {
            Lox.error(this.line, 'Unterminated string.');
            return;
        }

        // The closing ".
        this.advance();

        // Trim the surrounding quotes.
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
    }

    match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) !== expected) return false;

        this.current++;
        return true;
    }

    peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }

    isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
               (c >= 'A' && c <= 'Z') ||
                c === '_';
    }

    isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    number() {
        while (this.isDigit(this.peek())) this.advance();

        if (this.peek() == '.' && this.isDigit(this.peekNext())) {
            this.advance();

            while (this.isDigit(this.peek())) this.advance();
        }

        this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
    }

    advance(): string {
        return this.source.charAt(this.current++);
    }

    addToken(type: TokenType, literal: any = null) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line));
    }
}
