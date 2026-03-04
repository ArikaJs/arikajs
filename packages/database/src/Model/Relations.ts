import { Model, ModelQueryBuilder } from './Model';
import { Database } from '../Database';

// ─── Base ──────────────────────────────────────────────────────────────────

/**
 * Base class for all relationship types
 */
export abstract class Relation<T extends Model = Model> {
    constructor(
        protected related: typeof Model,
        protected parent: Model
    ) { }

    abstract get(): Promise<T | T[] | null>;

    /**
     * Get a raw subquery to count the relations for a parent query.
     */
    abstract getRelationCountQuery(outerTable: string, outerKey?: string): { sql: string, bindings: any[] };

    /**
     * Compare if a related model instance is the same as another
     */
    is(model: Model | null): boolean {
        if (!model) return false;
        const instance = new (this.related as any)();
        const pk = instance['getPrimaryKey']();
        return (this.parent as any)[pk] === (model as any)[pk];
    }

    isNot(model: Model | null): boolean {
        return !this.is(model);
    }
}

// ─── Has One ───────────────────────────────────────────────────────────────

export class HasOne<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected foreignKey: string,
        protected localKey: string = 'id'
    ) {
        super(related, parent);
    }

    async get(): Promise<T | null> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        if (!parentKeyValue) return null;
        return await this.related
            .where(this.foreignKey, parentKeyValue)
            .first() as T | null;
    }

    query(): ModelQueryBuilder<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>().where(this.foreignKey, parentKeyValue);
    }

    getRelationCountQuery(outerTable: string, outerKey: string = this.localKey): { sql: string; bindings: any[] } {
        const relatedTable = (this.related as any).table;
        return {
            sql: `(SELECT COUNT(*) FROM ${relatedTable} WHERE ${relatedTable}.${this.foreignKey} = ${outerTable}.${outerKey})`,
            bindings: []
        };
    }

    /**
     * Create a related record and associate it with the parent
     */
    async create(data: Record<string, any>): Promise<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>().create({
            ...data,
            [this.foreignKey]: parentKeyValue,
        });
    }

    /**
     * Save a related model and associate it with the parent
     */
    async save(model: T): Promise<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        (model as any).setAttribute(this.foreignKey, parentKeyValue);
        await (model as any).save();
        return model;
    }
}

// ─── Has Many ──────────────────────────────────────────────────────────────

export class HasMany<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected foreignKey: string,
        protected localKey: string = 'id'
    ) {
        super(related, parent);
    }

    async get(): Promise<T[]> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        if (!parentKeyValue) return [];
        return await this.related
            .where(this.foreignKey, parentKeyValue)
            .get() as T[];
    }

    query(): ModelQueryBuilder<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>().where(this.foreignKey, parentKeyValue);
    }

    getRelationCountQuery(outerTable: string, outerKey: string = this.localKey): { sql: string; bindings: any[] } {
        const relatedTable = (this.related as any).table;
        return {
            sql: `(SELECT COUNT(*) FROM ${relatedTable} WHERE ${relatedTable}.${this.foreignKey} = ${outerTable}.${outerKey})`,
            bindings: []
        };
    }

    /**
     * Create a related record
     */
    async create(data: Record<string, any>): Promise<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>().create({
            ...data,
            [this.foreignKey]: parentKeyValue,
        });
    }

    /**
     * Bulk-create multiple related records
     */
    async createMany(records: Record<string, any>[]): Promise<T[]> {
        return Promise.all(records.map(data => this.create(data)));
    }

    /**
     * Save a related model and associate it with the parent
     */
    async save(model: T): Promise<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        (model as any).setAttribute(this.foreignKey, parentKeyValue);
        await (model as any).save();
        return model;
    }

    /**
     * Save multiple related models
     */
    async saveMany(models: T[]): Promise<T[]> {
        return Promise.all(models.map(m => this.save(m)));
    }
}

// ─── Belongs To ────────────────────────────────────────────────────────────

export class BelongsTo<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected foreignKey: string,
        protected ownerKey: string = 'id'
    ) {
        super(related, parent);
    }

    async get(): Promise<T | null> {
        const foreignKeyValue = (this.parent as any)[this.foreignKey];
        if (!foreignKeyValue) return null;
        return await this.related
            .where(this.ownerKey, foreignKeyValue)
            .first() as T | null;
    }

    query(): ModelQueryBuilder<T> {
        const foreignKeyValue = (this.parent as any)[this.foreignKey];
        return this.related.query<T>().where(this.ownerKey, foreignKeyValue);
    }

    getRelationCountQuery(outerTable: string, outerKey: string = this.foreignKey): { sql: string; bindings: any[] } {
        const relatedTable = (this.related as any).table;
        return {
            sql: `(SELECT COUNT(*) FROM ${relatedTable} WHERE ${relatedTable}.${this.ownerKey} = ${outerTable}.${outerKey})`,
            bindings: []
        };
    }

    /**
     * Associate this model with the given related model (sets the FK on parent)
     */
    associate(model: T): this {
        (this.parent as any).setAttribute(
            this.foreignKey,
            (model as any)[this.ownerKey]
        );
        return this;
    }

    /**
     * Dissociate — nullify the foreign key on the parent
     */
    dissociate(): this {
        (this.parent as any).setAttribute(this.foreignKey, null);
        return this;
    }
}

// ─── Belongs To Many ───────────────────────────────────────────────────────

/**
 * Pivot metadata attached to each related model
 */
export interface PivotData {
    [key: string]: any;
}

export class BelongsToMany<T extends Model = Model> extends Relation<T> {
    private pivotColumns: string[] = [];
    private pivotWheres: Array<{ column: string; value: any }> = [];

    constructor(
        related: typeof Model,
        parent: Model,
        protected pivotTable: string,
        protected foreignPivotKey: string,
        protected relatedPivotKey: string,
        protected parentKey: string = 'id',
        protected relatedKey: string = 'id'
    ) {
        super(related, parent);
    }

    /**
     * Include extra pivot columns in the result
     */
    withPivot(...columns: string[]): this {
        this.pivotColumns.push(...columns);
        return this;
    }

    /**
     * Filter results by a pivot column value
     */
    wherePivot(column: string, value: any): this {
        this.pivotWheres.push({ column, value });
        return this;
    }

    async get(): Promise<T[]> {
        const parentKeyValue = (this.parent as any)[this.parentKey];
        if (!parentKeyValue) return [];

        const relatedTable = (this.related as any).table;
        const connection = await Database.connection((this.related as any).connection);

        // Build the pivot extra columns selector
        const pivotCols = this.pivotColumns
            .map(c => `${this.pivotTable}.${c} AS __pivot_${c}`)
            .join(', ');

        const selectExtra = pivotCols ? `, ${pivotCols}` : '';

        // Build pivot where clauses
        const pivotWhereSQL = this.pivotWheres
            .map(w => `AND ${this.pivotTable}.${w.column} = ?`)
            .join(' ');
        const pivotWhereBindings = this.pivotWheres.map(w => w.value);

        const sql = `
            SELECT ${relatedTable}.*${selectExtra}
            FROM ${relatedTable}
            INNER JOIN ${this.pivotTable}
                ON ${relatedTable}.${this.relatedKey} = ${this.pivotTable}.${this.relatedPivotKey}
            WHERE ${this.pivotTable}.${this.foreignPivotKey} = ?
            ${pivotWhereSQL}
        `;

        const results = await connection.query(sql, [parentKeyValue, ...pivotWhereBindings]);

        return results.map((data: any) => {
            const instance = new (this.related as any)();

            // Separate pivot columns from model columns
            const pivotData: PivotData = {};
            const modelData: Record<string, any> = {};

            for (const [key, val] of Object.entries(data)) {
                if (key.startsWith('__pivot_')) {
                    pivotData[key.replace('__pivot_', '')] = val;
                } else {
                    modelData[key] = val;
                }
            }

            instance.fill(modelData);
            instance.setExists(true);

            // Attach pivot data as a property on the model
            (instance as any).pivot = pivotData;

            return instance as T;
        });
    }

    getRelationCountQuery(outerTable: string, outerKey: string = this.parentKey): { sql: string; bindings: any[] } {
        const relatedTable = (this.related as any).table;
        const pivotWhereSQL = this.pivotWheres
            .map(w => `AND ${this.pivotTable}.${w.column} = ?`)
            .join(' ');
        const pivotWhereBindings = this.pivotWheres.map(w => w.value);

        const sql = `(SELECT COUNT(*) FROM ${relatedTable} INNER JOIN ${this.pivotTable} ON ${relatedTable}.${this.relatedKey} = ${this.pivotTable}.${this.relatedPivotKey} WHERE ${this.pivotTable}.${this.foreignPivotKey} = ${outerTable}.${outerKey} ${pivotWhereSQL})`;
        return { sql, bindings: pivotWhereBindings };
    }

    /**
     * Attach one or many related models to the pivot table
     */
    async attach(ids: any | any[], pivotData: Record<string, any> = {}): Promise<void> {
        const parentKeyValue = (this.parent as any)[this.parentKey];
        const connection = await Database.connection((this.related as any).connection);

        const idList = Array.isArray(ids) ? ids : [ids];
        const extraCols = Object.keys(pivotData);
        const extraVals = Object.values(pivotData);

        for (const relatedId of idList) {
            const cols = [this.foreignPivotKey, this.relatedPivotKey, ...extraCols].join(', ');
            const placeholders = [parentKeyValue, relatedId, ...extraVals].map(() => '?').join(', ');
            const sql = `INSERT INTO ${this.pivotTable} (${cols}) VALUES (${placeholders})`;
            await connection.query(sql, [parentKeyValue, relatedId, ...extraVals]);
        }
    }

    /**
     * Detach one, many, or all related models from the pivot table
     */
    async detach(ids?: any | any[]): Promise<void> {
        const parentKeyValue = (this.parent as any)[this.parentKey];
        const connection = await Database.connection((this.related as any).connection);

        if (ids === undefined) {
            // Detach all
            await connection.query(
                `DELETE FROM ${this.pivotTable} WHERE ${this.foreignPivotKey} = ?`,
                [parentKeyValue]
            );
        } else {
            const idList = Array.isArray(ids) ? ids : [ids];
            const placeholders = idList.map(() => '?').join(', ');
            await connection.query(
                `DELETE FROM ${this.pivotTable} WHERE ${this.foreignPivotKey} = ? AND ${this.relatedPivotKey} IN (${placeholders})`,
                [parentKeyValue, ...idList]
            );
        }
    }

    /**
     * Sync the pivot table — attach missing, detach extras
     */
    async sync(ids: any[], pivotData: Record<string, any> = {}): Promise<void> {
        const parentKeyValue = (this.parent as any)[this.parentKey];
        const connection = await Database.connection((this.related as any).connection);

        // Get current pivot IDs
        const existing = await connection.query(
            `SELECT ${this.relatedPivotKey} FROM ${this.pivotTable} WHERE ${this.foreignPivotKey} = ?`,
            [parentKeyValue]
        );
        const existingIds: any[] = existing.map((row: any) => row[this.relatedPivotKey]);

        const toAttach = ids.filter(id => !existingIds.includes(id));
        const toDetach = existingIds.filter((id: any) => !ids.includes(id));

        if (toAttach.length > 0) await this.attach(toAttach, pivotData);
        if (toDetach.length > 0) await this.detach(toDetach);
    }

    /**
     * Toggle — attach if not present, detach if already present
     */
    async toggle(ids: any | any[]): Promise<void> {
        const parentKeyValue = (this.parent as any)[this.parentKey];
        const connection = await Database.connection((this.related as any).connection);
        const idList = Array.isArray(ids) ? ids : [ids];

        const existing = await connection.query(
            `SELECT ${this.relatedPivotKey} FROM ${this.pivotTable} WHERE ${this.foreignPivotKey} = ?`,
            [parentKeyValue]
        );
        const existingIds: any[] = existing.map((row: any) => row[this.relatedPivotKey]);

        const toAttach = idList.filter((id: any) => !existingIds.includes(id));
        const toDetach = idList.filter((id: any) => existingIds.includes(id));

        if (toAttach.length > 0) await this.attach(toAttach);
        if (toDetach.length > 0) await this.detach(toDetach);
    }
}

// ─── Has One Through ───────────────────────────────────────────────────────

/**
 * HasOneThrough — relate models through an intermediate table.
 *
 * Example: Country → hasOneThrough(Capital, User)
 *   countries → through users → capitals
 */
export class HasOneThrough<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected through: typeof Model,
        protected firstKey: string,         // FK on through table pointing to parent
        protected secondKey: string,        // FK on related table pointing to through
        protected localKey: string = 'id',  // PK of parent
        protected secondLocalKey: string = 'id' // PK of through model
    ) {
        super(related, parent);
    }

    async get(): Promise<T | null> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        if (!parentKeyValue) return null;

        const throughTable = (this.through as any).table;
        const relatedTable = (this.related as any).table;
        const connection = await Database.connection((this.related as any).connection);

        const sql = `
            SELECT ${relatedTable}.*
            FROM ${relatedTable}
            INNER JOIN ${throughTable}
                ON ${relatedTable}.${this.secondKey} = ${throughTable}.${this.secondLocalKey}
            WHERE ${throughTable}.${this.firstKey} = ?
            LIMIT 1
        `;

        const results = await connection.query(sql, [parentKeyValue]);
        if (!results.length) return null;

        const instance = new (this.related as any)();
        instance.fill(results[0]);
        instance.setExists(true);
        return instance as T;
    }

    getRelationCountQuery(outerTable: string, outerKey: string = this.localKey): { sql: string; bindings: any[] } {
        const throughTable = (this.through as any).table;
        const relatedTable = (this.related as any).table;
        const sql = `(SELECT COUNT(*) FROM ${relatedTable} INNER JOIN ${throughTable} ON ${relatedTable}.${this.secondKey} = ${throughTable}.${this.secondLocalKey} WHERE ${throughTable}.${this.firstKey} = ${outerTable}.${outerKey})`;
        return { sql, bindings: [] };
    }
}

// ─── Has Many Through ──────────────────────────────────────────────────────

/**
 * HasManyThrough — relate models through an intermediate table.
 *
 * Example: Country → hasManyThrough(Post, User)
 *   countries → through users → posts
 */
export class HasManyThrough<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected through: typeof Model,
        protected firstKey: string,
        protected secondKey: string,
        protected localKey: string = 'id',
        protected secondLocalKey: string = 'id'
    ) {
        super(related, parent);
    }

    async get(): Promise<T[]> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        if (!parentKeyValue) return [];

        const throughTable = (this.through as any).table;
        const relatedTable = (this.related as any).table;
        const connection = await Database.connection((this.related as any).connection);

        const sql = `
            SELECT ${relatedTable}.*
            FROM ${relatedTable}
            INNER JOIN ${throughTable}
                ON ${relatedTable}.${this.secondKey} = ${throughTable}.${this.secondLocalKey}
            WHERE ${throughTable}.${this.firstKey} = ?
        `;

        const results = await connection.query(sql, [parentKeyValue]);

        return results.map((data: any) => {
            const instance = new (this.related as any)();
            instance.fill(data);
            instance.setExists(true);
            return instance as T;
        });
    }

    query(): any {
        const parentKeyValue = (this.parent as any)[this.localKey];
        const throughTable = (this.through as any).table;
        const relatedTable = (this.related as any).table;

        return Database.table(relatedTable)
            .whereRaw(
                `${relatedTable}.${this.secondKey} IN (SELECT ${this.secondLocalKey} FROM ${throughTable} WHERE ${this.firstKey} = ?)`,
                [parentKeyValue]
            );
    }

    getRelationCountQuery(outerTable: string, outerKey: string = this.localKey): { sql: string; bindings: any[] } {
        const throughTable = (this.through as any).table;
        const relatedTable = (this.related as any).table;
        const sql = `(SELECT COUNT(*) FROM ${relatedTable} INNER JOIN ${throughTable} ON ${relatedTable}.${this.secondKey} = ${throughTable}.${this.secondLocalKey} WHERE ${throughTable}.${this.firstKey} = ${outerTable}.${outerKey})`;
        return { sql, bindings: [] };
    }
}

// ─── Polymorphic Relationships ─────────────────────────────────────────────

/**
 * MorphOne — polymorphic has-one
 *
 * Example: Post → morphOne(Image, 'imageable')
 *   images table has: imageable_id, imageable_type
 */
export class MorphOne<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected morphName: string,        // e.g. 'imageable'
        protected morphType: string,        // column: imageable_type
        protected morphId: string,          // column: imageable_id
        protected localKey: string = 'id'
    ) {
        super(related, parent);
    }

    private getMorphType(): string {
        return (this.parent.constructor as any).name;
    }

    async get(): Promise<T | null> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        if (!parentKeyValue) return null;

        return await this.related
            .where(this.morphType, this.getMorphType())
            .where(this.morphId, parentKeyValue)
            .first() as T | null;
    }

    query(): ModelQueryBuilder<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>()
            .where(this.morphType, this.getMorphType())
            .where(this.morphId, parentKeyValue);
    }

    async create(data: Record<string, any>): Promise<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>().create({
            ...data,
            [this.morphType]: this.getMorphType(),
            [this.morphId]: parentKeyValue,
        });
    }

    getRelationCountQuery(outerTable: string, outerKey: string = this.localKey): { sql: string; bindings: any[] } {
        const relatedTable = (this.related as any).table;
        const sql = `(SELECT COUNT(*) FROM ${relatedTable} WHERE ${relatedTable}.${this.morphId} = ${outerTable}.${outerKey} AND ${relatedTable}.${this.morphType} = ?)`;
        return { sql, bindings: [this.getMorphType()] };
    }
}

/**
 * MorphMany — polymorphic has-many
 *
 * Example: Post → morphMany(Comment, 'commentable')
 */
export class MorphMany<T extends Model = Model> extends Relation<T> {
    constructor(
        related: typeof Model,
        parent: Model,
        protected morphName: string,
        protected morphType: string,
        protected morphId: string,
        protected localKey: string = 'id'
    ) {
        super(related, parent);
    }

    private getMorphType(): string {
        return (this.parent.constructor as any).name;
    }

    async get(): Promise<T[]> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        if (!parentKeyValue) return [];

        return await this.related
            .where(this.morphType, this.getMorphType())
            .where(this.morphId, parentKeyValue)
            .get() as T[];
    }

    query(): ModelQueryBuilder<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>()
            .where(this.morphType, this.getMorphType())
            .where(this.morphId, parentKeyValue);
    }

    async create(data: Record<string, any>): Promise<T> {
        const parentKeyValue = (this.parent as any)[this.localKey];
        return this.related.query<T>().create({
            ...data,
            [this.morphType]: this.getMorphType(),
            [this.morphId]: parentKeyValue,
        });
    }

    async createMany(records: Record<string, any>[]): Promise<T[]> {
        return Promise.all(records.map(d => this.create(d)));
    }

    getRelationCountQuery(outerTable: string, outerKey: string = this.localKey): { sql: string; bindings: any[] } {
        const relatedTable = (this.related as any).table;
        const sql = `(SELECT COUNT(*) FROM ${relatedTable} WHERE ${relatedTable}.${this.morphId} = ${outerTable}.${outerKey} AND ${relatedTable}.${this.morphType} = ?)`;
        return { sql, bindings: [this.getMorphType()] };
    }
}

/**
 * MorphTo — inverse polymorphic relationship
 *
 * Example: Comment → morphTo('commentable')
 *   reads commentable_type + commentable_id to find the owner
 */
export class MorphTo<T extends Model = Model> extends Relation<T> {
    private morphMap: Map<string, typeof Model>;

    constructor(
        parent: Model,
        protected morphName: string,
        protected morphType: string,    // column: commentable_type
        protected morphId: string,      // column: commentable_id
        morphMap: Record<string, typeof Model> = {}
    ) {
        // Pass parent as related too (placeholder — resolved dynamically)
        super(parent.constructor as typeof Model, parent);
        this.morphMap = new Map(Object.entries(morphMap));
    }

    /**
     * Register a morph type → Model class mapping
     */
    map(morphMap: Record<string, typeof Model>): this {
        for (const [key, val] of Object.entries(morphMap)) {
            this.morphMap.set(key, val);
        }
        return this;
    }

    async get(): Promise<T | null> {
        const morphType = (this.parent as any)[this.morphType];
        const morphId = (this.parent as any)[this.morphId];

        if (!morphType || !morphId) return null;

        const relatedClass = this.morphMap.get(morphType);
        if (!relatedClass) {
            throw new Error(
                `No morph map entry for type "${morphType}". ` +
                `Call .map({ '${morphType}': YourModel }) on this MorphTo instance.`
            );
        }

        return await relatedClass.find<T>(morphId);
    }

    getRelationCountQuery(outerTable: string, outerKey: string = this.morphId): { sql: string; bindings: any[] } {
        throw new Error('Calling withCount on a MorphTo relationship is not supported yet natively. Please count inside the mapped relations.');
    }
}
