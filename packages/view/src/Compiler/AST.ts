export enum NodeType {
    Root = 'Root',
    Text = 'Text',
    Expression = 'Expression',
    RawExpression = 'RawExpression',
    Directive = 'Directive',
}

export interface Node {
    type: NodeType;
    [key: string]: any;
}

export interface RootNode extends Node {
    type: NodeType.Root;
    children: Node[];
}

export interface TextNode extends Node {
    type: NodeType.Text;
    content: string;
}

export interface ExpressionNode extends Node {
    type: NodeType.Expression;
    content: string;
}

export interface RawExpressionNode extends Node {
    type: NodeType.RawExpression;
    content: string;
}

export interface DirectiveNode extends Node {
    type: NodeType.Directive;
    name: string;
    expression: string | null;
    children?: Node[];
}
