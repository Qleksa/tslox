import Token from "../types/Token";
import { RuntimeError } from "./Interpreter";
import LoxClass from "./LoxClass";

export default class LoxInstance {
    private klass: LoxClass;
    private fields: Map<string, any> = new Map<string, any>();

    constructor(klass: LoxClass) {
        this.klass = klass;
    }

    get(name: Token) {
        if (this.fields.has(name.lexeme)) {
            return this.fields.get(name.lexeme);
        }

        const method = this.klass.findMethod(name.lexeme);
        if (method) return method.bind(this);

        throw new RuntimeError(name, `Undefined property ${name.lexeme}.`);
    }

    set(name: Token, value: any) {
        this.fields.set(name.lexeme, value);
    }

    toString(): string {
        return this.klass.name + ' instance';
    }
}
