import { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Unary, Variable } from "./Expr";
import { Block, Expression, Function, If, Print, Return as ReturnStmt, Stmt, StmtVisitor, Var, While } from "./Stmt";
import Lox from "../Lox";
import Token from "../types/Token";
import { TokenType } from "../types/TokenType";
import Environment from "./Environment";
import LoxCallable from "./LoxCallable";
import LoxFunction from "./LoxFunction";
import Return from "./Return";

class ClockCallable implements LoxCallable {

    arity(): number {
        return 0;
    }

    call(interpreter: Interpreter, args: any[]) {
        return Date.now() / 1000.0;
    }

    toString(): string {
        return '<native fn>';
    }
}

export default class Interpreter implements ExprVisitor<any>, StmtVisitor<void> {

    globals = new Environment(); 
    private env = this.globals;
    private locals = new Map<Expr, number>();

    constructor() {
        this.globals.define('clock', new ClockCallable());
    }

    interpret(statements: Stmt[]): void {
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        } catch (error) {
            if (error instanceof RuntimeError) {
                Lox.runtimeError(error);
            }
            console.error('Unexpected error', error);
        }
    }

    visitAssignExpr(expr: Assign) {
        const value = this.evaluate(expr.value);

        const distance = this.locals.get(expr);
        distance ? this.env.assignAt(distance, expr.name, value) : this.globals.assign(expr.name, value);
        
        return value;
    }

    visitCallExpr(expr: Call) {
        const callee = this.evaluate(expr.callee);

        const args = expr.args.map(arg => this.evaluate(arg));

        if (!this.isCallable(callee)) {
            throw new RuntimeError(expr.paren, 'Can only call functions and classes.');
        }
        const func = callee as LoxCallable;
        if (args.length != func.arity()) {
            throw new RuntimeError(expr.paren, `Expected ${func.arity()} arguments but got ${args.length}.`);
        }

        return func.call(this, args);
    }

    visitBinaryExpr(expr: Binary): any {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.GREATER: 
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);
            case TokenType.GREATER_EQUAL: 
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right);
            case TokenType.BANG_EQUAL:
                return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right);
            case TokenType.MINUS: 
                this.checkNumberOperand(expr.operator, right);
                return Number(left) - Number(right);
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) / Number(right);
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);
            case TokenType.PLUS: {
                if (this.isNumber(left) && this.isNumber(right)) {
                    return Number(left) + Number(right);
                }

                if (this.isString(left) && this.isString(right)) {
                    return left.toString() + right.toString();
                }

                throw new RuntimeError(expr.operator, 'Operands must be two numbers or two string.');
            }
        }

        return null;
    }

    visitGroupingExpr(expr: Grouping): any {
        return this.evaluate(expr.expression);
    }

    visitLiteralExpr(expr: Literal): any {
        return expr.value;
    }

    visitLogicalExpr(expr: Logical) {
        const left = this.evaluate(expr.left);

        if (expr.operator.type == TokenType.OR) {
            if (this.isTruthy(left)) return left;
        } else {
            if (!this.isTruthy(left)) return left;
        }

        return this.evaluate(expr.right);
    }

    visitUnaryExpr(expr: Unary): any {
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.MINUS: return -Number(right);
            case TokenType.BANG: return !this.isTruthy(right);
        }

        return null;
    }

    visitVariableExpr(expr: Variable): any {
        return this.lookUpVariable(expr.name, expr);
    }

    private lookUpVariable(name: Token, expr: Expr): any {
        const distance = this.locals.get(expr);
        return distance ? this.env.getAt(distance, name.lexeme) : this.globals.get(name);
    }

    private checkNumberOperand(operator: Token, operand: any): void {
        if (this.isNumber(operand)) return;
        throw new RuntimeError(operator, 'Operand must be a number.');
    }

    private checkNumberOperands(operator: Token, left: any, right: any): void {
        if (this.isNumber(left) && this.isNumber(right)) return;
        throw new RuntimeError(operator, 'Operands must be numbers.');
    }

    private evaluate(expr: Expr): any {
        return expr.accept(this);
    }

    private execute(stmt: Stmt): void {
        stmt.accept(this);
    }

    resolve(expr: Expr, depth: number): void {
        this.locals.set(expr, depth);
    }

    executeBlock(statements: Stmt[], env: Environment) {
        const previous = this.env;
        try {
            this.env = env;
            for (const statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.env = previous;
        }
    }

    visitIfStmt(stmt: If): void {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch) {
            this.execute(stmt.elseBranch);
        }
    }

    visitWhileStmt(stmt: While): void {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
    }
    

    visitExpressionStmt(stmt: Expression): void {
        this.evaluate(stmt.expression);
    }

    
    visitFunctionStmt(stmt: Function): void {
        const func = new LoxFunction(stmt, this.env);
        this.env.define(stmt.name.lexeme, func);
    }

    visitPrintStmt(stmt: Print): void {
        const value = this.evaluate(stmt.expression);
        console.log(value);
    }
    
    visitReturnStmt(stmt: ReturnStmt): void {
        let value = null;
        if (stmt.value) value = this.evaluate(stmt.value);

        throw new Return(value);
    }

    visitBlockStmt(stmt: Block): void {
        this.executeBlock(stmt.statements, new Environment(this.env));
    }

    visitVarStmt(stmt: Var): void {
        let value = null;
        if (stmt.initializer != null) {
            value = this.evaluate(stmt.initializer);
        }

        this.env.define(stmt.name.lexeme, value);
    }

    private isTruthy(object: any): Boolean {
        if (object == null) return false;
        if (typeof object === 'boolean') return Boolean(object);
        return true;
    }

    private isEqual(a: any, b: any): Boolean {
        return a === b;
    }

    private isNumber(object: any): Boolean {
        return typeof object === 'number';
    }

    private isString(object: any): Boolean {
        return typeof object === 'string';
    }

    private isCallable(value: any): value is LoxCallable {
        return value !== null &&
               value !== undefined &&
                typeof value.call === 'function' &&
                typeof value.arity === 'function';
    }
}


export class RuntimeError extends Error {
    token: Token;

    constructor(token: Token, message: string) {
        super(message);
        this.token = token;
    }
}
