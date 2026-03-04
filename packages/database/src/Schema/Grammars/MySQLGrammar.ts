
import { TableBlueprint, ColumnDefinition } from '../Schema';
import { Grammar } from './Grammar';

/**
 * MySQL grammar for schema building
 */
export class MySQLGrammar extends Grammar {
    public compileCreate(blueprint: TableBlueprint): string {
        const columns = blueprint.getColumns().map(column => this.compileColumn(column));

        // Add primary keys
        const primaryKeys = blueprint.getColumns()
            .filter(column => column.primary)
            .map(column => column.name);

        if (primaryKeys.length > 0) {
            columns.push(`PRIMARY KEY (${primaryKeys.join(', ')})`);
        }

        // Add unique indexes
        blueprint.getIndexes().forEach(index => {
            if (index.unique) {
                columns.push(`UNIQUE INDEX ${index.name || ''} (${index.columns.join(', ')})`);
            } else {
                columns.push(`INDEX ${index.name || ''} (${index.columns.join(', ')})`);
            }
        });

        // Add foreign keys
        blueprint.getForeignKeys().forEach(fk => {
            let sql = `CONSTRAINT fk_${blueprint.tableName}_${fk.column} FOREIGN KEY (${fk.column}) REFERENCES ${fk.referencedTable}(${fk.referencedColumn})`;
            if (fk.onDeleteAction) sql += ` ON DELETE ${fk.onDeleteAction.toUpperCase()}`;
            if (fk.onUpdateAction) sql += ` ON UPDATE ${fk.onUpdateAction.toUpperCase()}`;
            columns.push(sql);
        });

        return `CREATE TABLE ${blueprint.tableName} (\n  ${columns.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
    }

    public compileAlter(blueprint: TableBlueprint): string[] {
        const statements: string[] = [];
        const alterBase = `ALTER TABLE ${blueprint.tableName}`;

        // 1. Drop columns & indexes
        const dropColumns = blueprint.getDropColumns().map(name => `DROP COLUMN ${name}`);
        const dropIndexes = blueprint.getDropIndexes().map(name => `DROP INDEX ${name}`);
        const dropForeignKeys = blueprint.getDropForeignKeys ? blueprint.getDropForeignKeys().map(name => `DROP FOREIGN KEY ${name}`) : [];

        const dropOperations = [...dropColumns, ...dropIndexes, ...dropForeignKeys];
        if (dropOperations.length > 0) {
            statements.push(`${alterBase} ${dropOperations.join(', ')}`);
        }

        // 2. Add columns
        const addColumns = blueprint.getColumns().map(column => `ADD COLUMN ${this.compileColumn(column)}`);
        if (addColumns.length > 0) {
            statements.push(`${alterBase} ${addColumns.join(', ')}`);
        }

        // 3. Add indexes
        const addIndexes = blueprint.getIndexes().map(index => {
            if (index.unique) {
                return `ADD UNIQUE INDEX ${index.name || ''} (${index.columns.join(', ')})`;
            } else {
                return `ADD INDEX ${index.name || ''} (${index.columns.join(', ')})`;
            }
        });

        if (addIndexes.length > 0) {
            statements.push(`${alterBase} ${addIndexes.join(', ')}`);
        }

        // 4. Add foreign keys
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
        let sql = `${column.name} ${this.getType(column)}`;

        if (column.unsigned_) {
            sql += ' UNSIGNED';
        }

        if (!column.nullable_) {
            sql += ' NOT NULL';
        }

        sql += this.getDefault(column);

        if (column.autoIncrement) {
            sql += ' AUTO_INCREMENT';
        }

        if (column.comment_) {
            sql += ` COMMENT '${column.comment_}'`;
        }

        return sql;
    }

    protected getType(column: ColumnDefinition): string {
        switch (column.type) {
            case 'bigInteger': return 'BIGINT';
            case 'integer': return 'INT';
            case 'string': return `VARCHAR(${column.length || 255})`;
            case 'boolean': return 'TINYINT(1)';
            case 'text': return 'TEXT';
            case 'timestamp': return 'TIMESTAMP';
            case 'decimal': return `DECIMAL(${column.precision || 8}, ${column.scale || 2})`;
            case 'date': return 'DATE';
            case 'datetime': return 'DATETIME';
            case 'json': return 'JSON';
            default: return 'VARCHAR(255)';
        }
    }
}
