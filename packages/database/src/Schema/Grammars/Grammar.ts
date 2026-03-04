
import { TableBlueprint, ColumnDefinition } from '../Schema';

/**
 * Base grammar class for schema building
 */
export abstract class Grammar {
    /**
     * Compile the create table SQL
     */
    public abstract compileCreate(blueprint: TableBlueprint): string;

    /**
     * Compile the alter table SQL (adding/dropping/modifying columns and indexes)
     * Returns an array of SQL statements since some engines require multiple statements for altering.
     */
    public abstract compileAlter(blueprint: TableBlueprint): string[];

    /**
     * Compile the drop table SQL
     */
    public abstract compileDrop(tableName: string): string;

    /**
     * Compile the drop table if exists SQL
     */
    public abstract compileDropIfExists(tableName: string): string;

    /**
     * Map a column definition to its SQL type
     */
    protected abstract getType(column: ColumnDefinition): string;

    /**
     * Get the default value SQL
     */
    protected getDefault(column: ColumnDefinition): string {
        if (column.default_ !== undefined) {
            if (typeof column.default_ === 'string') {
                return ` DEFAULT '${column.default_}'`;
            }
            if (typeof column.default_ === 'boolean') {
                return ` DEFAULT ${column.default_ ? 1 : 0}`;
            }
            return ` DEFAULT ${column.default_}`;
        }
        return '';
    }
}
