import { RootNode, Node, NodeType, TextNode, ExpressionNode, RawExpressionNode, DirectiveNode } from './AST';
import { DirectiveRegistry } from './DirectiveRegistry';

export class CodeGenerator {
    private registry: DirectiveRegistry;

    constructor(registry: DirectiveRegistry) {
        this.registry = registry;
    }

    public generate(root: RootNode, isStream = false): string {
        const append = isStream ? 'yield ' : '_output += ';
        let jsCode = isStream ? '' : 'let _output = "";\n';
        jsCode += 'const _escape = (val) => String(val ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\\\'/g, "&#39;");\n';

        jsCode += this.generateNodes(root.children, append);

        if (!isStream) {
            jsCode += 'return _output;';
        }
        return jsCode;
    }

    private generateNodes(nodes: Node[], append: string): string {
        return nodes.map(node => this.generateNode(node, append)).join('\n');
    }

    private generateNode(node: Node, append: string): string {
        let code = '';
        switch (node.type) {
            case NodeType.Text:
                const text = (node as TextNode).content
                    .replace(/\\/g, '\\\\')
                    .replace(/`/g, '\\`')
                    .replace(/\${/g, '\\${');
                code = `${append}\`${text}\`;`;
                break;

            case NodeType.Expression:
                code = `${append}_escape(${this.cleanExpression((node as ExpressionNode).content)});`;
                break;

            case NodeType.RawExpression:
                code = `${append}(${this.cleanExpression((node as RawExpressionNode).content)});`;
                break;

            case NodeType.Directive:
                const dir = node as DirectiveNode;
                const childrenCode = dir.children ? this.generateNodes(dir.children, append) : '';
                const cleanedExp = dir.expression ? this.cleanExpression(dir.expression) : null;
                const result = this.registry.handle(dir.name, cleanedExp, childrenCode, append);

                if (result === null) {
                    // Fallback for unknown directives (e.g., CSS @media, @keyframes)
                    const originalText = `@${dir.name}${dir.expression ? '(' + dir.expression + ')' : ''}`;
                    const sanitized = originalText.replace(/`/g, '\\`').replace(/\${/g, '\\${');
                    code = `${append}\`${sanitized}\`;\n${childrenCode}`;
                } else {
                    code = result;
                }
                
                // Inject Source Tracking for Dev Inspector (Visual Tracing)
                // We wrap the output to inject a marker if it's a high-level block
                if (node.line && (dir.name === 'component' || dir.name === 'include' || dir.name === 'yield')) {
                    const sourceInfo = `${node.line}:${node.column}`;
                    // Naive but effective for these core directives
                    code = code.replace(/_output \+= `/g, `_output += \`<!-- arika-src:${sourceInfo} -->`);
                }
                break;
        }

        if (node.line && code) {
            // Enhanced source mapping comment for Error Overlay and Dev Inspector
            return `/* @line:${node.line}:${node.column} */ ${code}`;
        }

        return code;
    }

    private cleanExpression(exp: string): string {
        // Strip leading $ from variables to support Laravel-style {{ $var }}
        // This regex finds $ followed by an identifier and replaces it with just the identifier
        return exp.replace(/(^|[^a-zA-Z0-9_])\$([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1$2');
    }
}
