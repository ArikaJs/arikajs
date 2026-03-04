
import { TableBlueprint, ColumnDefinition } from '../Schema';
import { Grammar } from './Grammar';

/**
 * SQLite grammar for schema building
 */
export class SQLiteGrammar extends Grammar {
    public compileCreate(blueprint: TableBlueprint): string {
        const columns = blueprint.getColumns().map(column => this.compileColumn(column));

        return `CREATE TABLE ${blueprint.tableName} (\n  ${columns.join(',\n  ')}\n)`;
    }

    public compileAlter(blueprint: TableBlueprint): string[] {
        const statements: string[] = [];
        const alterBase = `ALTER TABLE ${blueprint.tableName}`;

        // 1. Drop columns (supported in recent SQLite versions >= 3.35.0)
        blueprint.getDropColumns().forEach(name => {
            statements.push(`${alterBase} DROP COLUMN ${name}`);
        });

        // 2. Add columns
        blueprint.getColumns().forEach(column => {
            statements.push(`${alterBase} ADD COLUMN ${this.compileColumn(column)}`);
        });

        // 3. Drop indexes
        blueprint.getDropIndexes().forEach(name => {
            statements.push(`DROP INDEX IF EXISTS ${name}`);
        });

        // 4. Add indexes
        blueprint.getIndexes().forEach(index => {
            const indexName = index.name || `${blueprint.tableName}_${index.columns.join('_')}_index`;
            if (index.unique) {
                statements.push(`CREATE UNIQUE INDEX ${indexName} ON ${blueprint.tableName} (${index.columns.join(', ')})`);
            } else {
                statements.push(`CREATE INDEX ${indexName} ON ${blueprint.tableName} (${index.columns.join(', ')})`);
            }
        });

        // Warn internally if dropping foreign keys, as SQLite ALTER TABLE doesn't natively drop constraints
        if (blueprint.getDropForeignKeys && blueprint.getDropForeignKeys().length > 0) {
            console.warn('SQLite does not natively support dropping foreign keys via ALTER TABLE. Please recreate the table.');
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
        let sql = `${column.name} ${this.getType(column)}`;

        if (column.primary) {
            sql += ' PRIMARY KEY';
            if (column.autoIncrement) {
                sql += ' AUTOINCREMENT';
            }
        }

        if (!column.nullable_) {
            sql += ' NOT NULL';
        }

        if (column.unique_) {
            sql += ' UNIQUE';
        }

        sql += this.getDefault(column);

        return sql;
    }

    protected getType(column: ColumnDefinition): string {
        switch (column.type) {
            case 'bigInteger': return 'INTEGER';
            case 'integer': return 'INTEGER';
            case 'string': return 'TEXT';
            case 'boolean': return 'INTEGER';
            case 'text': return 'TEXT';
            case 'timestamp': return 'DATETIME';
            case 'decimal': return 'NUMERIC';
            case 'date': return 'DATE';
            case 'datetime': return 'DATETIME';
            case 'json': return 'TEXT';
            default: return 'TEXT';
        }
    }
}
