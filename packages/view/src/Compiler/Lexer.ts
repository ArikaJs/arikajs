export enum TokenType {
    Text = 'Text',
    Expression = 'Expression',        // {{ expr }}
    RawExpression = 'RawExpression',   // {!! expr !!}
    Directive = 'Directive',           // @directive(expr) or @directive
    ComponentStart = 'ComponentStart', // <x-component
    ComponentEnd = 'ComponentEnd',     // </x-component>
}

export interface Token {
    type: TokenType;
    value: string;
    line: number;
}

export class Lexer {
    private input: string;
    private position: number = 0;
    private line: number = 1;

    constructor(input: string) {
        this.input = input;
    }

    public tokenize(): Token[] {
        const tokens: Token[] = [];
        while (this.position < this.input.length) {
            const char = this.input[this.position];

            // Raw Expression {!! ... !!}
            if (this.input.startsWith('{!!', this.position)) {
                tokens.push(this.consumeRawExpression());
                continue;
            }

            // Comment {{-- ... --}}
            if (this.input.startsWith('{{--', this.position)) {
                this.consumeComment();
                continue;
            }

            // Expression {{ ... }}
            if (this.input.startsWith('{{', this.position)) {
                tokens.push(this.consumeExpression());
                continue;
            }

            // Component End </x-
            if (this.input.startsWith('</x-', this.position)) {
                tokens.push(this.consumeComponentEnd());
                continue;
            }

            // Component Start <x-
            if (this.input.startsWith('<x-', this.position)) {
                tokens.push(this.consumeComponentStart());
                continue;
            }

            // Directive @...
            if (char === '@') {
                // Peek if it's an escaped @@
                if (this.input[this.position + 1] === '@') {
                    tokens.push({ type: TokenType.Text, value: '@', line: this.line });
                    this.position += 2;
                    continue;
                }

                // Peek to see if it's a valid directive name (following letters)
                const nextChar = this.input[this.position + 1];
                if (nextChar && /[a-zA-Z]/.test(nextChar)) {
                    tokens.push(this.consumeDirective());
                    continue;
                } else {
                    // Not a directive, treat as regular text
                    tokens.push({ type: TokenType.Text, value: '@', line: this.line });
                    this.position++;
                    continue;
                }
            }

            // Otherwise, it's text
            const textToken = this.consumeText();
            if (textToken.value.length > 0) {
                tokens.push(textToken);
            } else if (this.position < this.input.length) {
                // Avoid infinite loop if no other token matches but position didn't advance
                const char = this.input[this.position];
                tokens.push({ type: TokenType.Text, value: char, line: this.line });
                if (char === '\n') this.line++;
                this.position++;
            }
        }
        return tokens;
    }

    private consumeRawExpression(): Token {
        const start = this.position;
        this.position += 3; // {!!
        while (this.position < this.input.length && !this.input.startsWith('!!}', this.position)) {
            if (this.input[this.position] === '\n') this.line++;
            this.position++;
        }
        this.position += 3; // !!}
        return {
            type: TokenType.RawExpression,
            value: this.input.substring(start + 3, this.position - 3).trim(),
            line: this.line
        };
    }

    private consumeExpression(): Token {
        const start = this.position;
        this.position += 2; // {{
        while (this.position < this.input.length && !this.input.startsWith('}}', this.position)) {
            if (this.input[this.position] === '\n') this.line++;
            this.position++;
        }
        this.position += 2; // }}
        return {
            type: TokenType.Expression,
            value: this.input.substring(start + 2, this.position - 2).trim(),
            line: this.line
        };
    }

    private consumeDirective(): Token {
        const start = this.position;
        this.position++; // @
        while (this.position < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.position])) {
            this.position++;
        }

        let value = this.input.substring(start, this.position);

        // Check for expression @directive(...)
        // Skip whitespace
        while (this.position < this.input.length && /[ \t]/.test(this.input[this.position])) {
            this.position++;
        }

        if (this.input[this.position] === '(') {
            let parenCount = 1;
            this.position++;
            const exprStart = this.position;
            while (this.position < this.input.length && parenCount > 0) {
                if (this.input[this.position] === '(') parenCount++;
                if (this.input[this.position] === ')') parenCount--;
                if (this.input[this.position] === '\n') this.line++;
                this.position++;
            }
            value = this.input.substring(start, this.position);
        }

        return {
            type: TokenType.Directive,
            value,
            line: this.line
        };
    }

    private consumeComponentStart(): Token {
        const start = this.position;
        while (this.position < this.input.length && this.input[this.position] !== '>') {
            if (this.input[this.position] === '\n') this.line++;
            this.position++;
        }
        this.position++; // >
        return {
            type: TokenType.ComponentStart,
            value: this.input.substring(start, this.position),
            line: this.line
        };
    }

    private consumeComponentEnd(): Token {
        const start = this.position;
        while (this.position < this.input.length && this.input[this.position] !== '>') {
            this.position++;
        }
        this.position++; // >
        return {
            type: TokenType.ComponentEnd,
            value: this.input.substring(start, this.position),
            line: this.line
        };
    }

    private consumeComment(): void {
        this.position += 4; // {{--
        while (this.position < this.input.length && !this.input.startsWith('--}}', this.position)) {
            if (this.input[this.position] === '\n') this.line++;
            this.position++;
        }
        this.position += 4; // --}}
    }

    private consumeText(): Token {
        const start = this.position;
        while (this.position < this.input.length) {
            const char = this.input[this.position];
            if (char === '@' ||
                this.input.startsWith('{{--', this.position) ||
                this.input.startsWith('{{', this.position) ||
                this.input.startsWith('{!!', this.position) ||
                this.input.startsWith('<x-', this.position) ||
                this.input.startsWith('</x-', this.position)) {
                break;
            }
            if (char === '\n') this.line++;
            this.position++;
        }
        return {
            type: TokenType.Text,
            value: this.input.substring(start, this.position),
            line: this.line
        };
    }
}
