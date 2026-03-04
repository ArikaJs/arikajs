import { Model, ModelQueryBuilder } from './Model';

/**
 * Soft Delete interface
 */
export interface SoftDeletes {
    deleted_at: Date | null;
}

/**
 * Mixin to add soft delete functionality to models
 * 
 * Usage:
 * ```typescript
 * class User extends withSoftDeletes(Model) {
 *   static table = 'users';
 * }
 * 
 * await User.delete(1); // Soft deletes
 * await User.withTrashed().get(); // Include soft deleted
 * await User.restore(1); // Restore soft deleted
 * await User.forceDelete(1); // Permanently delete
 * ```
 */
export function withSoftDeletes<TBase extends typeof Model>(Base: TBase) {
    class SoftDeleteModel extends (Base as any) {
        /**
         * The name of the "deleted at" column
         */
        static deletedAtColumn: string = 'deleted_at';

        /**
         * Indicates if the model should use soft deletes
         */
        static useSoftDeletes: boolean = true;

        constructor(...args: any[]) {
            super(...args);
        }

        /**
         * Override delete to use soft deletes
         */
        static async delete(id: any): Promise<number> {
            if (this.useSoftDeletes) {
                const primaryKey = (this as any).getPrimaryKeyName();
                return await (this as any).query()
                    .where(primaryKey, id)
                    .update({ [(this as any).deletedAtColumn]: new Date() });
            }

            // Call the parent delete method
            return await (this as any).query().delete(id);
        }

        /**
         * Include trashed (soft deleted) records in query
         */
        static withTrashed<T extends Model>(): ModelQueryBuilder<T> {
            // Create a fresh query without soft delete filtering
            const connection = (this as any).getConnectionName();
            const table = (this as any).getTableName();
            const { Database } = require('../Database');
            const queryBuilder = Database.table(table, connection);
            const { ModelQueryBuilder } = require('./Model');
            return new ModelQueryBuilder(queryBuilder, this as any);
        }

        /**
         * Only get trashed (soft deleted) records
         */
        static onlyTrashed<T extends Model>(): ModelQueryBuilder<T> {
            return this.withTrashed<T>().whereNotNull((this as any).deletedAtColumn);
        }

        /**
         * Restore a soft deleted record
         */
        static async restore(id: any): Promise<number> {
            const primaryKey = (this as any).getPrimaryKeyName();
            return await this.withTrashed()
                .where(primaryKey, id)
                .update({ [(this as any).deletedAtColumn]: null });
        }

        /**
         * Force delete a record (permanently delete)
         */
        static async forceDelete(id: any): Promise<number> {
            const primaryKey = (this as any).getPrimaryKeyName();
            return await this.withTrashed()
                .where(primaryKey, id)
                .delete();
        }

        /**
         * Override query to automatically exclude soft deleted records
         */
        static query<T extends Model>(): ModelQueryBuilder<T> {
            const baseQuery: any = super.query();
            const queryBuilder = baseQuery as ModelQueryBuilder<T>;

            if ((this as any).useSoftDeletes) {
                queryBuilder.whereNull((this as any).deletedAtColumn);
            }

            return queryBuilder;
        }
    }

    return SoftDeleteModel as any as TBase;
}
