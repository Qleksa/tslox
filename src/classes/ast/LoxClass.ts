import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxFunction from "./LoxFunction";
import LoxInstance from "./LoxInstance";

export default class LoxClass implements LoxCallable {
    name: string;
    private methods: Map<string, LoxFunction>;
    superclass: LoxClass;

    constructor(name: string, superclass: LoxClass, methods: Map<string, LoxFunction>) {
        this.name = name;
        this.superclass = superclass;
        this.methods = methods;
    }

    findMethod(name: string): LoxFunction {
        if (this.methods.has(name)) {
            return this.methods.get(name);
        }

        if (this.superclass) {
            return this.superclass.findMethod(name);
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
