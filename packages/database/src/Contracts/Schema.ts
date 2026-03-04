/**
 * Column definition interface
 */
export interface ColumnDefinition {
    /**
     * Make the column nullable
     */
    nullable(): this;

    /**
     * Set a default value
     */
    default(value: any): this;

    /**
     * Make the column unique
     */
    unique(): this;

    /**
     * Make the column unsigned (for numeric types)
     */
    unsigned(): this;

    /**
     * Add a comment to the column
     */
    comment(comment: string): this;
}

/**
 * Table blueprint for schema building
 */
export interface Blueprint {
    /**
     * Create an auto-incrementing ID column
     */
    id(name?: string): ColumnDefinition;

    /**
     * Create a string column
     */
    string(name: string, length?: number): ColumnDefinition;

    /**
     * Create an integer column
     */
    integer(name: string): ColumnDefinition;

    /**
     * Create a big integer column
     */
    bigInteger(name: string): ColumnDefinition;

    /**
     * Create a boolean column
     */
    boolean(name: string): ColumnDefinition;

    /**
     * Create a text column
     */
    text(name: string): ColumnDefinition;

    /**
     * Create a timestamp column
     */
    timestamp(name: string): ColumnDefinition;

    /**
     * Create created_at and updated_at timestamp columns
     */
    timestamps(): void;

    /**
     * Create a decimal column
     */
    decimal(name: string, precision?: number, scale?: number): ColumnDefinition;

    /**
     * Create a date column
     */
    date(name: string): ColumnDefinition;

    /**
     * Create a datetime column
     */
    datetime(name: string): ColumnDefinition;

    /**
     * Create a JSON column
     */
    json(name: string): ColumnDefinition;

    /**
     * Add a foreign key constraint
     */
    foreign(column: string): ForeignKeyDefinition;

    /**
     * Add an index
     */
    index(columns: string | string[], name?: string): void;

    /**
     * Add a unique index
     */
    unique(columns: string | string[], name?: string): void;

    /**
     * Drop a column
     */
    dropColumn(name: string): void;

    /**
     * Drop an index
     */
    dropIndex(name: string): void;

    /**
     * Drop a foreign key constraint
     */
    dropForeignKey(name: string): void;
}

/**
 * Foreign key definition
 */
export interface ForeignKeyDefinition {
    /**
     * Set the referenced table
     */
    references(column: string): this;

    /**
     * Set the referenced table
     */
    on(table: string): this;

    /**
     * Set the on delete action
     */
    onDelete(action: 'cascade' | 'set null' | 'restrict' | 'no action'): this;

    /**
     * Set the on update action
     */
    onUpdate(action: 'cascade' | 'set null' | 'restrict' | 'no action'): this;
}

/**
 * Schema builder callback
 */
export type SchemaCallback = (table: Blueprint) => void;
