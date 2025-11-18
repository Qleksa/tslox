import fs from 'node:fs';
import readline from 'node:readline';

import Scanner from './Scanner'
import Token from './types/Token';
import { TokenType } from './types/TokenType';
import Parser from './ast/Parser';
import Interpreter, { RuntimeError } from './ast/Interpreter';
import Resolver from './ast/Resolver';

export default class Lox {
    private static interpreter = new Interpreter();
    private static hadError = false;
    private static hadRuntimeError = false;

    static runFile(path: string) {
        const data = fs.readFileSync(path, 'utf-8');
        this.run(data);

        if (this.hadError) process.exit(65);
        if (this.hadRuntimeError) process.exit(70);
    }

    static runPrompt() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> ',
        });
        console.log('Welcome to lox REPL!');
        rl.prompt();

        rl.on('line', (input) => {
            this.run(input);
            this.hadError = false;
            rl.prompt();
        });
    }

    private static run(source: string) {
        const scanner = new Scanner(source);
        const tokens = scanner.scanTokens();
        
        const parser = new Parser(tokens);
        const statements = parser.parse();

        if (this.hadError) return;

        const resolver = new Resolver(this.interpreter);
        resolver.resolve(statements);

        if (this.hadError) return;

        this.interpreter.interpret(statements);
    }

    private static report(line: number, where: string, message: string): void {
        console.error(`[line ${line}] Error${where}: ${message}`);
    }

    static error(line: number, message: string): void;
    static error(token: Token, message: string): void;
    static error(lineOrToken: number | Token, message: string): void {
        if (typeof lineOrToken === 'number') {
            this.report(lineOrToken, '', message);
        } else {
            const token = lineOrToken;
            if (token.type == TokenType.EOF) {
                this.report(token.line, " at end", message);
            } else {
                this.report(token.line, ` at '${token.lexeme}'`, message);
            }
        }
    }

    static runtimeError(error: RuntimeError): void {
        console.error(`${error.message}\n[line${error.token.line}]`);
        this.hadRuntimeError = true;
    }
}
