import {
    Blueprint,
    ColumnDefinition as ColumnDefinitionInterface,
    ForeignKeyDefinition as ForeignKeyDefinitionInterface,
    SchemaCallback,
} from '../Contracts/Schema';

/**
 * Column definition implementation
 */
export class ColumnDefinition implements ColumnDefinitionInterface {
    name: string;
    type: string;
    length?: number;
    precision?: number;
    scale?: number;
    nullable_?: boolean = false;
    default_?: any;
    unique_?: boolean = false;
    primary?: boolean = false;
    autoIncrement?: boolean = false;
    unsigned_?: boolean = false;
    comment_?: string;

    constructor(name: string, type: string) {
        this.name = name;
        this.type = type;
    }

    nullable(): this {
        this.nullable_ = true;
        return this;
    }

    default(value: any): this {
        this.default_ = value;
        return this;
    }

    unique(): this {
        this.unique_ = true;
        return this;
    }

    unsigned(): this {
        this.unsigned_ = true;
        return this;
    }

    comment(comment: string): this {
        this.comment_ = comment;
        return this;
    }
}

/**
 * Foreign key definition implementation
 */
export class ForeignKeyDefinition implements ForeignKeyDefinitionInterface {
    column: string;
    referencedColumn?: string;
    referencedTable?: string;
    onDeleteAction?: string;
    onUpdateAction?: string;

    constructor(column: string) {
        this.column = column;
    }

    references(column: string): this {
        this.referencedColumn = column;
        return this;
    }

    on(table: string): this {
        this.referencedTable = table;
        return this;
    }

    onDelete(action: 'cascade' | 'set null' | 'restrict' | 'no action'): this {
        this.onDeleteAction = action;
        return this;
    }

    onUpdate(action: 'cascade' | 'set null' | 'restrict' | 'no action'): this {
        this.onUpdateAction = action;
        return this;
    }
}

/**
 * Table blueprint implementation
 */
export class TableBlueprint implements Blueprint {
    private columns: ColumnDefinition[] = [];
    private foreignKeys: ForeignKeyDefinition[] = [];
    private indexes: Array<{ columns: string[]; name?: string; unique: boolean }> = [];
    private dropColumns: string[] = [];
    private dropIndexes: string[] = [];
    private dropForeignKeys: string[] = [];

    constructor(public tableName: string) { }

    id(name: string = 'id'): ColumnDefinition {
        const column = new ColumnDefinition(name, 'bigInteger');
        column.primary = true;
        column.autoIncrement = true;
        column.unsigned_ = true;
        this.columns.push(column);
        return column;
    }

    string(name: string, length: number = 255): ColumnDefinition {
        const column = new ColumnDefinition(name, 'string');
        column.length = length;
        this.columns.push(column);
        return column;
    }

    integer(name: string): ColumnDefinition {
        const column = new ColumnDefinition(name, 'integer');
        this.columns.push(column);
        return column;
    }

    bigInteger(name: string): ColumnDefinition {
        const column = new ColumnDefinition(name, 'bigInteger');
        this.columns.push(column);
        return column;
    }

    boolean(name: string): ColumnDefinition {
        const column = new ColumnDefinition(name, 'boolean');
        this.columns.push(column);
        return column;
    }

    text(name: string): ColumnDefinition {
        const column = new ColumnDefinition(name, 'text');
        this.columns.push(column);
        return column;
    }

    timestamp(name: string): ColumnDefinition {
        const column = new ColumnDefinition(name, 'timestamp');
        this.columns.push(column);
        return column;
    }

    timestamps(): void {
        this.timestamp('created_at').nullable();
        this.timestamp('updated_at').nullable();
    }

    decimal(name: string, precision: number = 8, scale: number = 2): ColumnDefinition {
        const column = new ColumnDefinition(name, 'decimal');
        column.precision = precision;
        column.scale = scale;
        this.columns.push(column);
        return column;
    }

    date(name: string): ColumnDefinition {
        const column = new ColumnDefinition(name, 'date');
        this.columns.push(column);
        return column;
    }

    datetime(name: string): ColumnDefinition {
        const column = new ColumnDefinition(name, 'datetime');
        this.columns.push(column);
        return column;
    }

    json(name: string): ColumnDefinition {
        const column = new ColumnDefinition(name, 'json');
        this.columns.push(column);
        return column;
    }

    foreign(column: string): ForeignKeyDefinition {
        const foreignKey = new ForeignKeyDefinition(column);
        this.foreignKeys.push(foreignKey);
        return foreignKey;
    }

    index(columns: string | string[], name?: string): void {
        const columnArray = Array.isArray(columns) ? columns : [columns];
        this.indexes.push({ columns: columnArray, name, unique: false });
    }

    unique(columns: string | string[], name?: string): void {
        const columnArray = Array.isArray(columns) ? columns : [columns];
        this.indexes.push({ columns: columnArray, name, unique: true });
    }

    dropColumn(name: string): void {
        this.dropColumns.push(name);
    }

    dropIndex(name: string): void {
        this.dropIndexes.push(name);
    }

    dropForeignKey(name: string): void {
        this.dropForeignKeys.push(name);
    }

    /**
     * Get all columns
     */
    getColumns(): ColumnDefinition[] {
        return this.columns;
    }

    /**
     * Get all foreign keys
     */
    getForeignKeys(): ForeignKeyDefinition[] {
        return this.foreignKeys;
    }

    /**
     * Get all indexes
     */
    getIndexes(): Array<{ columns: string[]; name?: string; unique: boolean }> {
        return this.indexes;
    }

    /**
     * Get columns to drop
     */
    getDropColumns(): string[] {
        return this.dropColumns;
    }

    /**
     * Get indexes to drop
     */
    getDropIndexes(): string[] {
        return this.dropIndexes;
    }

    /**
     * Get foreign keys to drop
     */
    getDropForeignKeys(): string[] {
        return this.dropForeignKeys;
    }
}

/**
 * Schema builder
 */
export class Schema {
    /**
     * Create a new table
     */
    static create(tableName: string, callback: SchemaCallback): TableBlueprint {
        const blueprint = new TableBlueprint(tableName);
        callback(blueprint);
        return blueprint;
    }

    /**
     * Modify an existing table
     */
    static table(tableName: string, callback: SchemaCallback): TableBlueprint {
        const blueprint = new TableBlueprint(tableName);
        callback(blueprint);
        return blueprint;
    }

    /**
     * Drop a table
     */
    static drop(tableName: string): { tableName: string; action: 'drop' } {
        return { tableName, action: 'drop' };
    }

    /**
     * Drop a table if it exists
     */
    static dropIfExists(tableName: string): { tableName: string; action: 'dropIfExists' } {
        return { tableName, action: 'dropIfExists' };
    }
}
