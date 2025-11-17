import Lox from './classes/Lox';

const args = process.argv.slice(2);

(function main() {
    if (args.length > 1) {
        console.log('Usage: jlox [script]');
        process.exit(64);
    } else if (args.length === 1) {
        Lox.runFile(args[0]);
    } else {
        Lox.runPrompt();
    }
})();
