import { Token, TokenType } from './Lexer';
import { Node, NodeType, RootNode, DirectiveNode } from './AST';

export class Parser {
    private tokens: Token[];
    private position: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    public parse(): RootNode {
        const root: RootNode = {
            type: NodeType.Root,
            children: []
        };

        while (this.position < this.tokens.length) {
            const lastPos = this.position;
            const node = this.parseNode();
            if (node) {
                root.children.push(node);
            }
            if (this.position <= lastPos && this.position < this.tokens.length) {
                this.position++; // Safety advance
            }
        }

        return root;
    }

    private parseNode(): Node | null {
        const token = this.tokens[this.position];

        if (token.type === TokenType.Text) {
            this.position++;
            return { type: NodeType.Text, content: token.value };
        }

        if (token.type === TokenType.Expression) {
            this.position++;
            return { type: NodeType.Expression, content: token.value };
        }

        if (token.type === TokenType.RawExpression) {
            this.position++;
            return { type: NodeType.RawExpression, content: token.value };
        }

        if (token.type === TokenType.Directive) {
            return this.parseDirective();
        }

        if (token.type === TokenType.ComponentStart) {
            return this.parseComponent();
        }

        this.position++;
        return null;
    }

    private parseDirective(): DirectiveNode {
        const token = this.tokens[this.position];
        this.position++;

        const match = token.value.match(/@(\w+)(?:\s*\((.*)\))?/s);
        const name = match ? match[1] : token.value.substring(1);
        const expression = match && match[2] ? match[2].trim() : null;

        const node: DirectiveNode = {
            type: NodeType.Directive,
            name,
            expression,
            line: token.line
        };

        // Check if this is a block directive (if, for, each, etc.)
        if (this.isBlockDirective(name)) {
            node.children = [];
            const endName = this.getEndDirectiveName(name);

            while (this.position < this.tokens.length) {
                const nextToken = this.tokens[this.position];
                if (nextToken.type === TokenType.Directive) {
                    const nextMatch = nextToken.value.match(/@(\w+)/);
                    const nextName = nextMatch ? nextMatch[1] : '';

                    if (nextName === endName) {
                        this.position++; // Consume end directive
                        break;
                    }

                    // Handle else/elseif/case/default which are part of the same block but start new sub-blocks?
                    // For now, let's keep it simple and just nest them as children.
                }

                const child = this.parseNode();
                if (child) {
                    node.children.push(child);
                }
            }
        }

        return node;
    }

    private parseComponent(): Node {
        const token = this.tokens[this.position];
        this.position++;

        // Basic parsing of <x-component-name attr="val">
        const match = token.value.match(/<x-([\w\.-]+)\s*(.*)>/s);
        const name = match ? match[1] : '';
        const attributesRaw = match ? match[2] : '';

        const node: DirectiveNode = {
            type: NodeType.Directive,
            name: 'component',
            expression: this.parseComponentAttributes(name, attributesRaw),
            line: token.line,
            children: []
        };

        // Components always have a closing tag </x-component-name>
        const endTag = `</x-${name}>`;
        if (endTag) {
            while (this.position < this.tokens.length) {
                const nextToken = this.tokens[this.position];
                if (nextToken.type === TokenType.ComponentEnd && nextToken.value.trim() === endTag) {
                    this.position++;
                    break;
                }

                const child = this.parseNode();
                if (child && node.children) {
                    node.children.push(child);
                }
            }
        }

        return node;
    }

    private parseComponentAttributes(name: string, raw: string): string {
        // Convert attributes to a JS object string
        // type="danger" :user="user"
        const attrs: Record<string, string> = {};
        const regex = /([:@]?[\w\.-]+)(?:="([^"]*)")?/g;
        let match;
        while ((match = regex.exec(raw)) !== null) {
            const key = match[1];
            const value = match[2] || 'true';

            if (key.startsWith(':')) {
                // Binding
                attrs[key.substring(1)] = value;
            } else {
                // Literal
                attrs[key] = `'${value}'`;
            }
        }

        const attrsStr = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ');
        return `'${name}', { ${attrsStr} }`;
    }

    private isBlockDirective(name: string): boolean {
        const blockDirectives = [
            'if', 'for', 'each', 'unless', 'empty', 'section', 'push', 'prepend',
            'component', 'slot', 'auth', 'guest', 'switch', 'once', 'verbatim', 'fragment', 'await', 'php'
        ];
        return blockDirectives.includes(name);
    }

    private getEndDirectiveName(name: string): string {
        if (name === 'section') return 'endsection';
        if (name === 'push') return 'endpush';
        if (name === 'prepend') return 'endprepend';
        if (name === 'component') return 'endcomponent';
        if (name === 'slot') return 'endslot';
        if (name === 'verbatim') return 'endverbatim';
        if (name === 'fragment') return 'endfragment';
        return `end${name}`;
    }
}
