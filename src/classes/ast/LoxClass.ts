import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxFunction from "./LoxFunction";
import LoxInstance from "./LoxInstance";

export default class LoxClass extends LoxInstance implements LoxCallable {
    name: string;
    private methods: Map<string, LoxFunction>;

    constructor(name: string, methods: Map<string, LoxFunction>) {
        this.name = name;
        this.methods = methods;
    }

    findMethod(name: string): LoxFunction {
        if (this.methods.has(name)) {
            return this.methods.get(name);
        }

        return null;
    }

    arity(): number {
        const initializer = this.findMethod("init");
        return initializer?.arity() || 0;
    }

    call(interpreter: Interpreter, args: any[]) {
        const instance = new LoxInstance(this);
        const initializer = this.findMethod("init");
        if (initializer) {
            initializer.bind(instance).call(interpreter, args);
        }

        return instance;
    }

    toString(): string {
        return this.name;
    }
}
