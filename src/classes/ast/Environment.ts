import Token from "../types/Token";
import { RuntimeError } from "./Interpreter";

export default class Environment {
    enclosing: Environment;
    values: Map<string, any> = new Map();

    constructor(enclosing?: Environment) {
        this.enclosing = enclosing ?? null;
    }

    get(name: Token) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }

        if (this.enclosing) return this.enclosing.get(name);

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    assign(name: Token, value: any): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing) {
            this.enclosing.assign(name, value);
            return; 
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    define(name: string, value: any): void {
        this.values.set(name, value);
    }

    ancestor(distance: number): Environment {
        let env: Environment = this;
        for (let i = 0; i < distance; i++) {
           env = env.enclosing;
        }

        return env;
    }

    getAt(distance: number, name: string): any {
        return this.ancestor(distance).values.get(name);
    }

    assignAt(distance: number, name: Token, value: any): void {
        this.ancestor(distance).values.set(name.lexeme, value);
    }
}
