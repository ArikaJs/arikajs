import { RootNode, Node, NodeType, TextNode, ExpressionNode, RawExpressionNode, DirectiveNode } from './AST';
import { DirectiveRegistry } from './DirectiveRegistry';

export class CodeGenerator {
    private registry: DirectiveRegistry;

    constructor(registry: DirectiveRegistry) {
        this.registry = registry;
    }

    public generate(root: RootNode): string {
        let jsCode = 'let _output = "";\n';
        jsCode += 'const _escape = (val) => String(val ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\\\'/g, "&#39;");\n';

        jsCode += this.generateNodes(root.children);

        jsCode += 'return _output;';
        return jsCode;
    }

    private generateNodes(nodes: Node[]): string {
        return nodes.map(node => this.generateNode(node)).join('\n');
    }

    private generateNode(node: Node): string {
        switch (node.type) {
            case NodeType.Text:
                const text = (node as TextNode).content
                    .replace(/\\/g, '\\\\')
                    .replace(/`/g, '\\`')
                    .replace(/\${/g, '\\${');
                return `_output += \`${text}\`;`;

            case NodeType.Expression:
                return `_output += _escape(${this.cleanExpression((node as ExpressionNode).content)});`;

            case NodeType.RawExpression:
                return `_output += (${this.cleanExpression((node as RawExpressionNode).content)});`;

            case NodeType.Directive:
                const dir = node as DirectiveNode;
                const childrenCode = dir.children ? this.generateNodes(dir.children) : '';
                const result = this.registry.handle(dir.name, dir.expression, childrenCode);

                if (result === null) {
                    // Fallback for unknown directives (e.g., CSS @media, @keyframes)
                    const originalText = `@${dir.name}${dir.expression ? '(' + dir.expression + ')' : ''}`;
                    const sanitized = originalText.replace(/`/g, '\\`').replace(/\${/g, '\\${');
                    return `_output += \`${sanitized}\`;\n${childrenCode}`;
                }
                return result;

            default:
                return '';
        }
    }

    private cleanExpression(exp: string): string {
        // Strip leading $ from variables to support Laravel-style {{ $var }}
        // This regex finds $ followed by an identifier and replaces it with just the identifier
        return exp.replace(/(^|[^a-zA-Z0-9_])\$([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1$2');
    }
}
