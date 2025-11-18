import path from "path";

const args = process.argv.slice(2);

if (args.length > 1) {
    console.log('Usage: generate_ast <output_directory>');
    process.exit(64);
}

const outputDir = args[0];

function defineAst(outputDir: string, baseName: string, types: string[], importStmt: string) {
    const baseBath = path.join(__dirname, outputDir, baseName + '.ts');
    const fs = require('fs');
    const writer = fs.createWriteStream(baseBath, { flags: 'w' });

    writer.write(importStmt);

    writer.write('export abstract class ' + baseName + ' {\n');

    writer.write('  abstract accept<R>(visitor: ' + baseName + 'Visitor<R>): R;\n');

    writer.write('}\n\n');

    defineVisitor(writer, baseName, types);

    for (const type of types) {
        const className = type.split('|')[0].trim();
        const fields = type.split('|')[1].trim();
        defineType(writer, baseName, className, fields);
    }
}

function defineType(writer: any, baseName: string, className: string, fieldList: string) {
    writer.write('export class ' + className + ' extends ' + baseName + ' {\n');

    const fields = fieldList.split(', ');
    for (const field of fields) {
        writer.write('  ' + field + ';\n');
    }

    writer.write('\n  constructor(' + fieldList + ') {\n');
    writer.write('    super();\n');
    for (const field of fields) {
        const name = field.split(':')[0].trim();
        writer.write('    this.' + name + ' = ' + name + ';\n');
    }
    writer.write('  }\n');

    writer.write('\n  accept<R>(visitor: ' + baseName + 'Visitor<R>): R {\n');
    writer.write('    return visitor.visit' + className + baseName + '(this);\n');
    writer.write('  }\n');

    writer.write('}\n\n');
}

function defineVisitor(writer: any, baseName: string, types: string[]) {
    writer.write('export interface ' + baseName + 'Visitor<R> {\n');

    for (const type of types) {
        const typeName = type.split('|')[0].trim();
        writer.write('  visit' + typeName + baseName + '(' + baseName.toLowerCase() + ': ' + typeName + '): R;\n');
    }

    writer.write('}\n\n');
}

defineAst(outputDir, 'Expr', [
    'Assign   | name: Token, value: Expr',
    'Binary   | left: Expr, operator: Token, right: Expr',
    'Call     | callee: Expr, paren: Token, args: Expr[]',
    'Get      | object: Expr, name: Token',
    'Grouping | expression: Expr',
    'Literal  | value: any',
    'Logical  | left: Expr, operator: Token, right: Expr',
    'Set      | object: Expr, name: Token, value: Expr',
    'This     | keyword: Token',
    'Unary    | operator: Token, right: Expr',
    'Variable | name: Token',
], 'import Token from "../../classes/types/Token";\n\n');

defineAst(outputDir, 'Stmt', [
    'Block      | statements: Stmt[]',
    'Class      | name: Token, methods: Function[]',
    'Expression | expression: Expr',
    'Function   | name: Token, params: Token[], body: Stmt[]',
    'If         | condition: Expr, thenBranch: Stmt, elseBranch: Stmt',
    'Print      | expression: Expr',
    'Return     | keyword: Token, value: Expr',
    'Var        | name: Token, initializer: Expr',
    'While      | condition: Expr, body: Stmt',
], 'import Token from "../../classes/types/Token";\n\nimport { Expr } from "./Expr";\n\n');