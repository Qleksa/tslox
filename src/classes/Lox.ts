import fs from 'node:fs';
import readline from 'node:readline';

import Scanner from './Scanner'
import Token from './types/Token';
import { TokenType } from './types/TokenType';
import Parser from './ast/Parser';
import Interpreter, { RuntimeError } from './ast/Interpreter';

export default class Lox {
    private static interpreter = new Interpreter();
    private static hadError = false;
    private static hadRuntimeError = false;

    static runFile(path: string) {
        const data = fs.readFileSync(path, 'utf-8');
        Lox.run(data);

        if (Lox.hadError) process.exit(65);
        if (Lox.hadRuntimeError) process.exit(70);
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
            Lox.run(input);
            Lox.hadError = false;
            rl.prompt();
        });
    }

    private static run(source: string) {
        const scanner = new Scanner(source);
        const tokens = scanner.scanTokens();
        
        const parser = new Parser(tokens);
        const statements = parser.parse();

        if (Lox.hadError) return;
        Lox.interpreter.interpret(statements);
    }

    private static report(line: number, where: string, message: string): void {
        console.error(`[line ${line}] Error${where}: ${message}`);
    }

    static error(line: number, message: string): void;
    static error(token: Token, message: string): void;
    static error(lineOrToken: number | Token, message: string): void {
        if (typeof lineOrToken === 'number') {
            Lox.report(lineOrToken, '', message);
        } else {
            const token = lineOrToken;
            if (token.type == TokenType.EOF) {
                Lox.report(token.line, " at end", message);
            } else {
                Lox.report(token.line, ` at '${token.lexeme}'`, message);
            }
        }
    }

    static runtimeError(error: RuntimeError): void {
        console.error(`${error.message}\n[line${error.token.line}]`);
        Lox.hadRuntimeError = true;
    }
}
