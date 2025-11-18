import Environment from "./Environment";
import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxInstance from "./LoxInstance";
import Return from "./Return";
import { Function } from "./Stmt";

export default class LoxFunction implements LoxCallable {
    private declaration: Function;
    private closure: Environment;
    private isInitializer: Boolean;

    constructor(declaration: Function, closure: Environment, isInitializer: Boolean) {
        this.declaration = declaration;
        this.closure = closure;
        this.isInitializer = isInitializer;
    }

    bind(instance: LoxInstance): LoxFunction {
        const env = new Environment(this.closure);
        env.define("this", instance);
        return new LoxFunction(this.declaration, env, this.isInitializer);
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
                if (this.isInitializer) return this.closure.getAt(0, "this");
                return error.value;
            }
            console.error("Unexpected error.", error);
        }

        if (this.isInitializer) return this.closure.getAt(0, "this");
        return null;
    }

    toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}