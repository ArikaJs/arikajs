import { Lexer } from './Compiler/Lexer';
import { Parser } from './Compiler/Parser';
import { CodeGenerator } from './Compiler/CodeGenerator';
import { DirectiveRegistry } from './Compiler/DirectiveRegistry';

export class Compiler {
    private registry: DirectiveRegistry;
    private generator: CodeGenerator;

    constructor() {
        this.registry = new DirectiveRegistry();
        this.generator = new CodeGenerator(this.registry);
    }

    /**
     * Add a custom directive to the compiler.
     */
    public addDirective(name: string, handler: (expression: string | null, children?: string) => string): void {
        this.registry.register(name, handler);
    }

    /**
     * Compile a template string into a executable JavaScript function body.
     */
    public compile(content: string): string {
        const lexer = new Lexer(content);
        const tokens = lexer.tokenize();

        const parser = new Parser(tokens);
        const ast = parser.parse();

        return this.generator.generate(ast);
    }
}
