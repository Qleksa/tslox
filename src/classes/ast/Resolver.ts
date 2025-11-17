import Lox from "../Lox";
import Token from "../types/Token";
import { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Unary, Variable } from "./Expr";
import Interpreter from "./Interpreter";
import { Block, Expression, Function, If, Print, Return, Stmt, StmtVisitor, Var, While } from "./Stmt";

export default class Resolver implements ExprVisitor<void>, StmtVisitor<void> {

    private interpreter: Interpreter;
    private scopes: Map<string, boolean>[];

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter;
    }

    resolve(arg: Stmt[] | Stmt | Expr): void {
        if (Array.isArray(arg)) {
            arg.forEach(stmt => this.resolve(stmt));
        } else {
            arg.accept(this);
        }
    }

    private beginScope(): void {
        this.scopes.push(new Map<string, boolean>());
    }

    private endScope(): void {
        this.scopes.pop();
    }

    private declare(name: Token): void {
        if (this.isEmpty()) return;
        this.peek().set(name.lexeme, false);
    }

    private define(name: Token): void {
        if (this.isEmpty()) return;
        this.peek().set(name.lexeme, true);
    }

    private resolveLocal(expr: Expr, name: Token): void {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name.lexeme)) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }
    }

    private resolveFunction(func: Function): void {
        this.beginScope();
        func.params.forEach(param => {
            this.declare(param);
            this.define(param);
        });
        this.resolve(func.body);
        this.endScope();
    }

    visitBlockStmt(stmt: Block): void {
        this.beginScope();
        this.resolve(stmt.statements);
        this.endScope();
    }

    visitExpressionStmt(stmt: Expression): void {
        this.resolve(stmt.expression);
    }

    visitFunctionStmt(stmt: Function): void {
        this.declare(stmt.name);
        this.define(stmt.name);

        this.resolveFunction(stmt);
    }

    visitIfStmt(stmt: If): void {
        this.resolve(stmt.condition);
        this.resolve(stmt.thenBranch);
        if (stmt.elseBranch) this.resolve(stmt.elseBranch);
    }

    visitPrintStmt(stmt: Print): void {
        this.resolve(stmt.expression);
    }

    visitReturnStmt(stmt: Return): void {
        if (stmt.value) this.resolve(stmt.value);
    }

    visitVarStmt(stmt: Var): void {
        this.declare(stmt.name);
        if (stmt.initializer) {
            this.resolve(stmt.initializer);
        }
        this.define(stmt.name);
    }

    visitWhileStmt(stmt: While): void {
        this.resolve(stmt.condition);
        this.resolve(stmt.body);
    }

    visitAssignExpr(expr: Assign): void {
        this.resolve(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    visitBinaryExpr(expr: Binary): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    visitCallExpr(expr: Call): void {
        this.resolve(expr.callee);
        expr.args.forEach(arg => this.resolve(arg));        
    }

    visitGroupingExpr(expr: Grouping): void {
        this.resolve(expr.expression);
    }

    visitLiteralExpr(expr: Literal): void {
        return null;
    }

    visitLogicalExpr(expr: Logical): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    visitUnaryExpr(expr: Unary): void {
        this.resolve(expr.right);
    }

    visitVariableExpr(expr: Variable): void {
        if (this.isEmpty() && this.peek().get(expr.name.lexeme) == false) {
            Lox.error(expr.name, "Can't read local variable in its own initializer.");
        }

        this.resolveLocal(expr, expr.name);
    }

    private isEmpty(): Boolean {
        return this.scopes.length === 0;
    }

    private peek(): Map<string, Boolean> {
        return this.scopes[this.scopes.length - 1];
    }
}
