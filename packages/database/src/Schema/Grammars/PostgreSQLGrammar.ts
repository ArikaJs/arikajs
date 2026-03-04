
import { TableBlueprint, ColumnDefinition } from '../Schema';
import { Grammar } from './Grammar';

/**
 * PostgreSQL grammar for schema building
 */
export class PostgreSQLGrammar extends Grammar {
    public compileCreate(blueprint: TableBlueprint): string {
        const columns = blueprint.getColumns().map(column => this.compileColumn(column));

        // Add primary keys
        const primaryKeys = blueprint.getColumns()
            .filter(column => column.primary)
            .map(column => column.name);

        if (primaryKeys.length > 0) {
            columns.push(`PRIMARY KEY (${primaryKeys.join(', ')})`);
        }

        return `CREATE TABLE ${blueprint.tableName} (\n  ${columns.join(',\n  ')}\n)`;
    }

    public compileAlter(blueprint: TableBlueprint): string[] {
        const statements: string[] = [];
        const alterBase = `ALTER TABLE ${blueprint.tableName}`;

        // 1. Drop columns & foreign keys
        const dropColumns = blueprint.getDropColumns().map(name => `DROP COLUMN IF EXISTS ${name} CASCADE`);
        const dropForeignKeys = blueprint.getDropForeignKeys ? blueprint.getDropForeignKeys().map(name => `DROP CONSTRAINT IF EXISTS ${name} CASCADE`) : [];

        const dropOperations = [...dropColumns, ...dropForeignKeys];
        if (dropOperations.length > 0) {
            statements.push(`${alterBase} ${dropOperations.join(', ')}`);
        }

        // 2. Add columns
        const addColumns = blueprint.getColumns().map(column => `ADD COLUMN ${this.compileColumn(column)}`);
        if (addColumns.length > 0) {
            statements.push(`${alterBase} ${addColumns.join(', ')}`);
        }

        // 3. Drop indexes
        const dropIndexes = blueprint.getDropIndexes();
        if (dropIndexes.length > 0) {
            dropIndexes.forEach(name => {
                statements.push(`DROP INDEX IF EXISTS ${name} CASCADE`);
            });
        }

        // 4. Add indexes
        blueprint.getIndexes().forEach(index => {
            const indexName = index.name || `${blueprint.tableName}_${index.columns.join('_')}_index`;
            if (index.unique) {
                statements.push(`CREATE UNIQUE INDEX ${indexName} ON ${blueprint.tableName} (${index.columns.join(', ')})`);
            } else {
                statements.push(`CREATE INDEX ${indexName} ON ${blueprint.tableName} (${index.columns.join(', ')})`);
            }
        });

        // 5. Add foreign keys
        const addForeignKeys = blueprint.getForeignKeys().map(fk => {
            let sql = `ADD CONSTRAINT fk_${blueprint.tableName}_${fk.column} FOREIGN KEY (${fk.column}) REFERENCES ${fk.referencedTable}(${fk.referencedColumn})`;
            if (fk.onDeleteAction) sql += ` ON DELETE ${fk.onDeleteAction.toUpperCase()}`;
            if (fk.onUpdateAction) sql += ` ON UPDATE ${fk.onUpdateAction.toUpperCase()}`;
            return sql;
        });

        if (addForeignKeys.length > 0) {
            statements.push(`${alterBase} ${addForeignKeys.join(', ')}`);
        }

        return statements;
    }

    public compileDrop(tableName: string): string {
        return `DROP TABLE ${tableName}`;
    }

    public compileDropIfExists(tableName: string): string {
        return `DROP TABLE IF EXISTS ${tableName}`;
    }

    protected compileColumn(column: ColumnDefinition): string {
        if (column.autoIncrement) {
            return `${column.name} ${column.type === 'bigInteger' ? 'BIGSERIAL' : 'SERIAL'} PRIMARY KEY`;
        }

        let sql = `${column.name} ${this.getType(column)}`;

        if (!column.nullable_) {
            sql += ' NOT NULL';
        }

        sql += this.getDefault(column);

        if (column.unique_) {
            sql += ' UNIQUE';
        }

        return sql;
    }

    protected getType(column: ColumnDefinition): string {
        switch (column.type) {
            case 'bigInteger': return 'BIGINT';
            case 'integer': return 'INTEGER';
            case 'string': return `VARCHAR(${column.length || 255})`;
            case 'boolean': return 'BOOLEAN';
            case 'text': return 'TEXT';
            case 'timestamp': return 'TIMESTAMP';
            case 'decimal': return `DECIMAL(${column.precision || 8}, ${column.scale || 2})`;
            case 'date': return 'DATE';
            case 'datetime': return 'TIMESTAMP';
            case 'json': return 'JSONB';
            default: return 'VARCHAR(255)';
        }
    }
}
