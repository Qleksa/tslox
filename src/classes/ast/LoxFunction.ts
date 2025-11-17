import Environment from "./Environment";
import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import Return from "./Return";
import { Function } from "./Stmt";

export default class LoxFunction implements LoxCallable {
    private declaration: Function;
    private closure: Environment;

    constructor(declaration: Function, closure: Environment) {
        this.declaration = declaration;
        this.closure = closure;
    }

    arity(): number {
        return this.declaration.params.length;
    }

    call(interpreter: Interpreter, args: any[]) {
        const env = new Environment(this.closure);
        this.declaration.params.forEach((param, index) => {
            env.define(param.lexeme, args[index]);
        });

        try {
            interpreter.executeBlock(this.declaration.body, env);
        } catch (error) {
            if (error instanceof Return) {
                return error.value;
            }
            console.error("Unexpected error.", error);
        }

        return null;
    }

    toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}