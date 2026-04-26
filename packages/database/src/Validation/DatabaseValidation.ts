import { Unique } from '@arikajs/validation';
import { Database } from '../Database';

export class DatabaseValidation {
    /**
     * Register the database-backed validation rules.
     */
    public static register() {
        Unique.setResolver(async (table: string, column: string, value: any, exceptId?: any, idColumn: string = 'id') => {
            const query = Database.table(table).where(column, value);

            if (exceptId !== undefined && exceptId !== null && exceptId !== '') {
                query.where(idColumn, '!=', exceptId);
            }

            const result = await query.count();
            return result === 0;
        });
    }
}
