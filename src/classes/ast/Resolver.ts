import Lox from "../Lox";
import Token from "../types/Token";
import { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Unary, Variable } from "./Expr";
import Interpreter from "./Interpreter";
import { Block, Expression, Function, If, Print, Return, Stmt, StmtVisitor, Var, While } from "./Stmt";

class TokenInfo {
    token: Token;
    isReady: Boolean = false;
    isUsed: Boolean = false;

    constructor(token: Token) {
        this.token = token;
    }
}

enum FunctionType {
    NONE,
    FUNCTION,
}

export default class Resolver implements ExprVisitor<void>, StmtVisitor<void> {

    private interpreter: Interpreter;
    private scopes: Map<string, TokenInfo>[] = [];
    private currentFunction = FunctionType.NONE;


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
        this.scopes.push(new Map<string, TokenInfo>());
    }

    private endScope(): void {
        const scope = this.scopes.pop();
        scope.forEach((token, key) => {
            if (!token.isUsed) {
                Lox.error(token.token, `Variable '${token.token.lexeme}' is declared but never used.`);
            }
        });
    }

    private declare(name: Token): void {
        if (this.isEmpty()) return;
        
        const scope = this.peek()
        if (scope.has(name.lexeme)) {
            Lox.error(name, "Variable with this name already exists in this scope.");
        }

        scope.set(name.lexeme, new TokenInfo(name));
    }

    private define(name: Token): void {
        if (this.isEmpty()) return;
        this.peek().get(name.lexeme).isReady = true;
    }

    private resolveLocal(expr: Expr, name: Token): void {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name.lexeme)) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                this.scopes[i].get(name.lexeme).isUsed = true;
                return;
            }
        }
    }

    private resolveFunction(func: Function, type: FunctionType): void {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = type; 

        this.beginScope();
        func.params.forEach(param => {
            this.declare(param);
            this.define(param);
        });
        this.resolve(func.body);
        this.endScope();
        this.currentFunction = enclosingFunction;
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

        this.resolveFunction(stmt, FunctionType.FUNCTION);
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
        if (this.currentFunction == FunctionType.NONE) {
            Lox.error(stmt.keyword, "Can't return from top-level code.");
        }
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
        if (!this.isEmpty() && this.peek().get(expr.name.lexeme).isReady == false) {
            Lox.error(expr.name, "Can't read local variable in its own initializer.");
        }

        this.resolveLocal(expr, expr.name);
    }

    private isEmpty(): Boolean {
        return this.scopes.length === 0;
    }

    private peek(): Map<string, TokenInfo> {
        return this.scopes[this.scopes.length - 1];
    }
}
