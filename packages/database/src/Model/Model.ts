import { Database } from '../Database';
import { QueryBuilder } from '../Query/QueryBuilder';
import {
    HasOne, HasMany, BelongsTo, BelongsToMany,
    HasOneThrough, HasManyThrough,
    MorphOne, MorphMany, MorphTo,
} from './Relations';
import { ObserverRegistry, ModelObserver } from './Observer';
import { GlobalScopeRegistry, GlobalScope, CallbackGlobalScope } from './GlobalScope';

/**
 * Base Model class for Active Record pattern
 */
export class Model {
    /**
     * The table associated with the model
     */
    protected static table: string = '';

    /**
     * Instance table name (for backward compatibility)
     */
    protected table: string = '';

    /**
     * The connection name for the model
     */
    protected static connection?: string;

    /**
     * Instance connection (for backward compatibility)
     */
    protected connection?: string;

    /**
     * The primary key for the model
     */
    protected static primaryKey: string = 'id';

    /**
     * Instance primary key (for backward compatibility)
     */
    protected primaryKey: string = 'id';

    /**
     * Indicates if the model should use timestamps
     */
    protected static timestamps: boolean = true;

    /**
     * Indicates if dates should be serialized to UTC (ISO string) or Local string
     */
    protected static serializeDateAsUtc: boolean = false;

    /**
     * Indicates if the model exists in the database
     */
    protected exists: boolean = false;

    /**
     * The model's original attributes (for dirty checking)
     */
    protected original: Record<string, any> = {};

    /**
     * The model's attributes
     */
    protected attributes: Record<string, any> = {};

    /**
     * Loaded relationships
     */
    protected relations: Record<string, any> = {};

    /**
     * The attributes that should be hidden for serialization.
     */
    protected hidden: string[] = [];

    /**
     * The attributes that should be visible for serialization.
     */
    protected visible: string[] = [];

    /**
     * The attributes that should be cast to native types.
     */
    protected casts: Record<string, 'int' | 'integer' | 'real' | 'float' | 'double' | 'string' | 'bool' | 'boolean' | 'object' | 'array' | 'json' | 'date' | 'datetime' | 'timestamp'> = {};

    constructor() {
        return new Proxy(this, {
            get(target: any, prop: string | symbol, receiver: any) {
                if (Reflect.has(target, prop)) {
                    return Reflect.get(target, prop, receiver);
                }

                if (typeof prop === 'string') {
                    // Check if it's a loaded relationship first
                    if (target.relations && prop in target.relations) {
                        return target.relations[prop];
                    }
                    return target.getAttribute(prop);
                }

                return undefined;
            },
            set(target: any, prop: string | symbol, value: any, receiver: any) {
                if (Reflect.has(target, prop)) {
                    return Reflect.set(target, prop, value, receiver);
                }

                if (typeof prop === 'string') {
                    target.setAttribute(prop, value);
                    return true;
                }

                return false;
            }
        });
    }

    /**
     * Create a new query builder for the model
     */
    static query<T extends Model>(this: typeof Model): ModelQueryBuilder<T> {
        const queryBuilder = Database.table(this.getTableName(), this.getConnectionName());
        const mqb = new ModelQueryBuilder<T>(queryBuilder, this as any);
        // Apply all registered global scopes
        GlobalScopeRegistry.applyAll(this.name, mqb, this);
        return mqb;
    }

    /**
     * Register an observer for this model
     */
    static observe(observer: ModelObserver): void {
        ObserverRegistry.register(this.name, observer);
    }

    /**
     * Add a global scope to this model
     */
    static addGlobalScope(
        name: string,
        scope: GlobalScope | ((builder: any, model: any) => void)
    ): void {
        const resolvedScope = typeof scope === 'function'
            ? new CallbackGlobalScope(scope as (builder: any, model: any) => void)
            : scope;
        GlobalScopeRegistry.register(this.name, name, resolvedScope);
    }

    /**
     * Remove a named global scope from this model
     */
    static removeGlobalScope(name: string): void {
        GlobalScopeRegistry.remove(this.name, name);
    }

    /**
     * Run a query without any global scopes
     */
    static withoutGlobalScopes<T extends Model>(this: typeof Model): ModelQueryBuilder<T> {
        const queryBuilder = Database.table(this.getTableName(), this.getConnectionName());
        return new ModelQueryBuilder<T>(queryBuilder, this as any);
    }

    /**
     * Find a record by ID
     */
    static async find<T extends Model>(this: typeof Model, id: any): Promise<T | null> {
        return this.query<T>().find(id);
    }

    /**
     * Find a record by ID or throw an error
     */
    static async findOrFail<T extends Model>(this: typeof Model, id: any): Promise<T> {
        const result = await this.find<T>(id);
        if (!result) {
            throw new Error(`${this.name} not found with ID ${id}`);
        }
        return result;
    }

    /**
     * Get all records
     */
    static async all<T extends Model>(this: typeof Model): Promise<T[]> {
        return this.query<T>().all();
    }

    /**
     * Add a where clause
     */
    static where<T extends Model>(this: typeof Model, column: string, operator: any, value?: any): ModelQueryBuilder<T> {
        return this.query<T>().where(column, operator, value);
    }

    /**
     * Add an OR where clause
     */
    static orWhere<T extends Model>(this: typeof Model, column: string, operator: any, value?: any): ModelQueryBuilder<T> {
        return this.query<T>().orWhere(column, operator, value);
    }

    /**
     * Add a where in clause
     */
    static whereIn<T extends Model>(this: typeof Model, column: string, values: any[]): ModelQueryBuilder<T> {
        return this.query<T>().whereIn(column, values);
    }

    /**
     * Add a where not in clause
     */
    static whereNotIn<T extends Model>(this: typeof Model, column: string, values: any[]): ModelQueryBuilder<T> {
        return this.query<T>().whereNotIn(column, values);
    }

    /**
     * Add a where null clause
     */
    static whereNull<T extends Model>(this: typeof Model, column: string): ModelQueryBuilder<T> {
        return this.query<T>().whereNull(column);
    }

    /**
     * Add a where not null clause
     */
    static whereNotNull<T extends Model>(this: typeof Model, column: string): ModelQueryBuilder<T> {
        return this.query<T>().whereNotNull(column);
    }

    /**
     * Add an order by clause
     */
    static orderBy<T extends Model>(this: typeof Model, column: string, direction?: 'asc' | 'desc'): ModelQueryBuilder<T> {
        return this.query<T>().orderBy(column, direction);
    }

    /**
     * Add a limit clause
     */
    static limit<T extends Model>(this: typeof Model, limit: number): ModelQueryBuilder<T> {
        return this.query<T>().limit(limit);
    }

    /**
     * Add an offset clause
     */
    static offset<T extends Model>(this: typeof Model, offset: number): ModelQueryBuilder<T> {
        return this.query<T>().offset(offset);
    }

    /**
     * Create a new record
     */
    static async create<T extends Model>(this: typeof Model, data: Record<string, any>): Promise<T> {
        return this.query<T>().create(data);
    }

    /**
     * Insert a record or multiple records (Bulk Insert)
     */
    static async insert<T extends Model>(this: typeof Model, data: Record<string, any> | Record<string, any>[]): Promise<any> {
        return this.query<T>().insert(data);
    }

    /**
     * Get the first record
     */
    static async first<T extends Model>(this: typeof Model): Promise<T | null> {
        return this.query<T>().first();
    }

    /**
     * Get records
     */
    static async get<T extends Model>(this: typeof Model): Promise<T[]> {
        return this.query<T>().get();
    }

    /**
     * Paginate the models
     */
    static async paginate<T extends Model>(this: typeof Model, page: number = 1, perPage: number = 15): Promise<{ data: T[], meta: any }> {
        return this.query<T>().paginate(page, perPage);
    }

    /**
     * Get the count of records
     */
    static async count(this: typeof Model, column?: string): Promise<number> {
        return this.query().count(column);
    }

    /**
     * Cache the query results
     */
    static cache<T extends Model>(this: typeof Model, ttl: number, key?: string): ModelQueryBuilder<T> {
        return this.query<T>().cache(ttl, key);
    }

    /**
     * Eager load relationships
     */
    static with<T extends Model>(
        this: typeof Model,
        relations: string | string[] | Record<string, (q: QueryBuilder) => void>
    ): ModelQueryBuilder<T> {
        return this.query<T>().with(relations);
    }

    /**
     * Delete a record by ID
     */
    static async delete(id: any): Promise<number> {
        return this.query().delete(id);
    }

    /**
     * Get the table name
     */
    protected static getTableName(): string {
        if (!this.table) {
            throw new Error('Table name not defined for model');
        }
        return this.table;
    }

    /**
     * Get the connection name
     */
    protected static getConnectionName(): string | undefined {
        return this.connection;
    }

    /**
     * Get the primary key
     */
    protected static getPrimaryKeyName(): string {
        return this.primaryKey;
    }

    /**
     * Get the table name (instance method)
     */
    protected getTable(): string {
        const constructor = this.constructor as typeof Model;
        return constructor.getTableName();
    }

    /**
     * Get the connection name (instance method)
     */
    protected getConnection(): string | undefined {
        const constructor = this.constructor as typeof Model;
        return constructor.getConnectionName();
    }

    /**
     * Get the primary key (instance method)
     */
    protected getPrimaryKey(): string {
        const constructor = this.constructor as typeof Model;
        return constructor.getPrimaryKeyName();
    }

    // ==================== Casts & Mutators ====================

    /**
     * Convert string into studly case (e.g. first_name -> FirstName)
     */
    private studly(value: string): string {
        return value.replace(/(?:^|_)(.)/g, (_, c) => c.toUpperCase());
    }

    /**
     * Cast an attribute to a native type.
     */
    protected castAttribute(key: string, value: any): any {
        if (value === null || value === undefined) {
            return value;
        }

        const castType = this.casts[key];
        if (!castType) {
            return value;
        }

        switch (castType) {
            case 'int':
            case 'integer':
                return parseInt(value, 10);
            case 'real':
            case 'float':
            case 'double':
                return parseFloat(value);
            case 'string':
                return String(value);
            case 'bool':
            case 'boolean':
                return value === 'true' || value === '1' || value === 1 || value === true;
            case 'object':
            case 'array':
            case 'json':
                return typeof value === 'string' ? JSON.parse(value) : value;
            case 'date':
            case 'datetime':
            case 'timestamp':
                return new Date(value);
            default:
                return value;
        }
    }

    /**
     * Cast an attribute to a native type for DB.
     */
    protected castAttributeForSave(key: string, value: any): any {
        if (value === null || value === undefined) {
            return value;
        }

        const castType = this.casts[key];

        // Always format dates even if not explicitly in casts for timestamps
        if (value instanceof Date) {
            return this.formatDate(value);
        }

        if (!castType) {
            return value;
        }

        switch (castType) {
            case 'object':
            case 'array':
            case 'json':
                return typeof value === 'object' ? JSON.stringify(value) : value;
            case 'date':
            case 'datetime':
            case 'timestamp':
                return value instanceof Date ? this.formatDate(value) : value;
            default:
                return value;
        }
    }

    /**
     * Format a date for database and JSON serialization
     */
    protected formatDate(date: Date): string {
        if ((this.constructor as typeof Model).serializeDateAsUtc) {
            return date.toISOString();
        }

        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
            `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    // ==================== Instance Methods ====================

    /**
     * Get an attribute value
     */
    getAttribute(key: string): any {
        const accessorMethod = `get${this.studly(key)}Attribute`;
        if (typeof (this as any)[accessorMethod] === 'function') {
            return (this as any)[accessorMethod](this.attributes[key]);
        }

        return this.castAttribute(key, this.attributes[key]);
    }

    /**
     * Set an attribute value
     */
    setAttribute(key: string, value: any): void {
        const mutatorMethod = `set${this.studly(key)}Attribute`;
        if (typeof (this as any)[mutatorMethod] === 'function') {
            (this as any)[mutatorMethod](value);
            return;
        }

        this.attributes[key] = this.castAttributeForSave(key, value);
    }

    /**
     * Fill the model with an array of attributes
     */
    fill(attributes: Record<string, any>): this {
        for (const [key, value] of Object.entries(attributes)) {
            this.setAttribute(key, value);
        }
        return this;
    }

    /**
     * Save the model to the database
     */
    async save(): Promise<boolean> {
        const modelName = (this.constructor as typeof Model).name;
        const query = Database.table(this.getTable(), this.getConnection());

        if (this.exists) {
            // Fire saving + updating events
            if (await ObserverRegistry.fire(modelName, 'saving', this) === false) return false;
            if (await ObserverRegistry.fire(modelName, 'updating', this) === false) return false;

            const primaryKey = this.getPrimaryKey();
            const id = this.attributes[primaryKey];

            if (!id) {
                throw new Error('Cannot update model without primary key value');
            }

            if (this.usesTimestamps()) {
                this.updateTimestamps();
            }

            const dirty = this.getDirty();
            if (Object.keys(dirty).length === 0) {
                return true; // No changes to save
            }

            await query.where(primaryKey, id).update(dirty);
            this.syncOriginal();

            // Fire saved + updated events
            await ObserverRegistry.fire(modelName, 'updated', this);
            await ObserverRegistry.fire(modelName, 'saved', this);
            return true;
        } else {
            // Fire saving + creating events
            if (await ObserverRegistry.fire(modelName, 'saving', this) === false) return false;
            if (await ObserverRegistry.fire(modelName, 'creating', this) === false) return false;

            if (this.usesTimestamps()) {
                this.updateTimestamps();
            }

            const result = await query.insert(this.attributes);

            const primaryKey = this.getPrimaryKey();
            if (result && result.insertId && !this.attributes[primaryKey]) {
                this.attributes[primaryKey] = result.insertId;
            }

            this.exists = true;
            this.syncOriginal();

            // Fire created + saved events
            await ObserverRegistry.fire(modelName, 'created', this);
            await ObserverRegistry.fire(modelName, 'saved', this);
            return true;
        }
    }

    /**
     * Update the model with an array of attributes
     */
    async update(attributes: Record<string, any>): Promise<boolean> {
        this.fill(attributes);
        return await this.save();
    }

    /**
     * Delete the model from the database
     */
    async delete(): Promise<boolean> {
        const modelName = (this.constructor as typeof Model).name;

        if (!this.exists) {
            return false;
        }

        const primaryKey = this.getPrimaryKey();
        const id = this.attributes[primaryKey];

        if (!id) {
            throw new Error('Cannot delete model without primary key value');
        }

        // Fire deleting event
        if (await ObserverRegistry.fire(modelName, 'deleting', this) === false) return false;

        const query = Database.table(this.getTable(), this.getConnection());
        await query.where(primaryKey, id).delete();

        this.exists = false;

        // Fire deleted event
        await ObserverRegistry.fire(modelName, 'deleted', this);
        return true;
    }

    /**
     * Refresh the model from the database
     */
    async refresh(): Promise<this> {
        if (!this.exists) {
            throw new Error('Cannot refresh a model that does not exist');
        }

        const primaryKey = this.getPrimaryKey();
        const id = this.attributes[primaryKey];

        const fresh = await Database.table(this.getTable(), this.getConnection())
            .where(primaryKey, id)
            .first();

        if (!fresh) {
            throw new Error('Model not found in database');
        }

        this.attributes = fresh;
        this.syncOriginal();

        return this;
    }

    /**
     * Get the attributes that have been changed since last sync
     */
    getDirty(): Record<string, any> {
        const dirty: Record<string, any> = {};

        for (const [key, value] of Object.entries(this.attributes)) {
            if (this.original[key] !== value) {
                dirty[key] = value;
            }
        }

        return dirty;
    }

    /**
     * Check if the model or specific attribute is dirty
     */
    isDirty(attribute?: string): boolean {
        if (attribute) {
            return this.original[attribute] !== this.attributes[attribute];
        }

        return Object.keys(this.getDirty()).length > 0;
    }

    /**
     * Sync the original attributes with the current attributes
     */
    protected syncOriginal(): void {
        this.original = { ...this.attributes };
    }

    /**
     * Check if the model uses timestamps
     */
    public usesTimestamps(): boolean {
        return (this.constructor as typeof Model).timestamps;
    }

    /**
     * Update the model's timestamps
     */
    protected updateTimestamps(): void {
        const now = new Date();

        if (this.usesTimestamps()) {
            this.setAttribute('updated_at', now);

            if (!this.exists && !this.getAttribute('created_at')) {
                this.setAttribute('created_at', now);
            }
        }
    }

    /**
     * Mark the model as existing
     */
    setExists(exists: boolean): this {
        this.exists = exists;
        return this;
    }

    /**
     * Convert the model to a plain object
     */
    toJSON(): Record<string, any> {
        let attributes = { ...this.attributes };

        // Handle date formatting in attributes
        for (const [key, value] of Object.entries(attributes)) {
            if (value instanceof Date) {
                attributes[key] = this.formatDate(value);
            }
        }

        let relations = { ...this.relations };
        // Handle date formatting in relations (recursive for nested models)
        for (const [key, value] of Object.entries(relations)) {
            if (value instanceof Model) {
                relations[key] = value.toJSON();
            } else if (Array.isArray(value)) {
                relations[key] = value.map(item => item instanceof Model ? item.toJSON() : item);
            }
        }

        let result = {
            ...attributes,
            ...relations,
        };

        // Filter hidden/visible attributes
        if (this.visible.length > 0) {
            result = Object.keys(result)
                .filter(key => this.visible.includes(key))
                .reduce((obj: any, key) => {
                    obj[key] = result[key];
                    return obj;
                }, {});
        } else if (this.hidden.length > 0) {
            this.hidden.forEach(key => {
                delete result[key];
            });
        }

        return result;
    }

    // ==================== Relationship Methods ====================

    /**
     * Define a has-one relationship
     */
    protected hasOne<T extends Model>(
        related: typeof Model,
        foreignKey?: string,
        localKey?: string
    ): HasOne<T> {
        const fk = foreignKey || `${this.getTable()}_id`;
        const lk = localKey || this.getPrimaryKey();
        return new HasOne<T>(related, this, fk, lk);
    }

    /**
     * Define a has-many relationship
     */
    protected hasMany<T extends Model>(
        related: typeof Model,
        foreignKey?: string,
        localKey?: string
    ): HasMany<T> {
        const fk = foreignKey || `${this.getTable()}_id`;
        const lk = localKey || this.getPrimaryKey();
        return new HasMany<T>(related, this, fk, lk);
    }

    /**
     * Define a belongs-to relationship
     */
    protected belongsTo<T extends Model>(
        related: typeof Model,
        foreignKey?: string,
        ownerKey?: string
    ): BelongsTo<T> {
        const relatedTable = (related as any).table;
        const fk = foreignKey || `${relatedTable}_id`;
        const ok = ownerKey || 'id';
        return new BelongsTo<T>(related, this, fk, ok);
    }

    /**
     * Define a belongs-to-many relationship
     */
    protected belongsToMany<T extends Model>(
        related: typeof Model,
        pivotTable?: string,
        foreignPivotKey?: string,
        relatedPivotKey?: string,
        parentKey?: string,
        relatedKey?: string
    ): BelongsToMany<T> {
        const relatedTable = (related as any).table;
        const thisTable = this.getTable();
        const pivot = pivotTable || [thisTable, relatedTable].sort().join('_');
        const fpk = foreignPivotKey || `${thisTable}_id`;
        const rpk = relatedPivotKey || `${relatedTable}_id`;
        const pk = parentKey || this.getPrimaryKey();
        const rk = relatedKey || 'id';
        return new BelongsToMany<T>(related, this, pivot, fpk, rpk, pk, rk);
    }

    /**
     * Define a has-one-through relationship
     *
     * Example: Country → hasOneThrough(Capital, Province, 'country_id', 'province_id')
     */
    protected hasOneThrough<T extends Model>(
        related: typeof Model,
        through: typeof Model,
        firstKey?: string,
        secondKey?: string,
        localKey: string = 'id',
        secondLocalKey: string = 'id'
    ): HasOneThrough<T> {
        const throughTable = (through as any).table;
        const fk = firstKey || `${this.getTable()}_id`;
        const sk = secondKey || `${throughTable}_id`;
        return new HasOneThrough<T>(related, this, through, fk, sk, localKey, secondLocalKey);
    }

    /**
     * Define a has-many-through relationship
     *
     * Example: Country → hasManyThrough(Post, User, 'country_id', 'user_id')
     */
    protected hasManyThrough<T extends Model>(
        related: typeof Model,
        through: typeof Model,
        firstKey?: string,
        secondKey?: string,
        localKey: string = 'id',
        secondLocalKey: string = 'id'
    ): HasManyThrough<T> {
        const throughTable = (through as any).table;
        const fk = firstKey || `${this.getTable()}_id`;
        const sk = secondKey || `${throughTable}_id`;
        return new HasManyThrough<T>(related, this, through, fk, sk, localKey, secondLocalKey);
    }

    /**
     * Define a polymorphic has-one relationship
     *
     * Example: Post → morphOne(Image, 'imageable')
     */
    protected morphOne<T extends Model>(
        related: typeof Model,
        morphName: string,
        localKey: string = 'id'
    ): MorphOne<T> {
        return new MorphOne<T>(
            related, this,
            morphName,
            `${morphName}_type`,
            `${morphName}_id`,
            localKey
        );
    }

    /**
     * Define a polymorphic has-many relationship
     *
     * Example: Post → morphMany(Comment, 'commentable')
     */
    protected morphMany<T extends Model>(
        related: typeof Model,
        morphName: string,
        localKey: string = 'id'
    ): MorphMany<T> {
        return new MorphMany<T>(
            related, this,
            morphName,
            `${morphName}_type`,
            `${morphName}_id`,
            localKey
        );
    }

    /**
     * Define the inverse of a polymorphic relationship
     *
     * Example: Comment → morphTo('commentable')
     */
    protected morphTo(
        morphName: string,
        morphMap: Record<string, typeof Model> = {}
    ): MorphTo {
        return new MorphTo(
            this,
            morphName,
            `${morphName}_type`,
            `${morphName}_id`,
            morphMap
        );
    }

    /**
     * Get a relationship value
     */
    getRelation(name: string): any {
        return this.relations[name];
    }

    /**
     * Set a relationship value
     */
    setRelation(name: string, value: any): this {
        this.relations[name] = value;
        return this;
    }

    /**
     * Eagerly load a relationship on this instance
     */
    async load(...relationNames: string[]): Promise<this> {
        for (const relation of relationNames) {
            if (typeof (this as any)[relation] === 'function') {
                const relationInstance = (this as any)[relation]();
                const result = await relationInstance.get();
                this.setRelation(relation, result);
            }
        }
        return this;
    }

    /**
     * Load relationships only if they haven't been loaded yet
     */
    async loadMissing(...relationNames: string[]): Promise<this> {
        const toLoad = relationNames.filter(name => !(name in this.relations));
        if (toLoad.length > 0) {
            await this.load(...toLoad);
        }
        return this;
    }
}

/**
 * Model query builder wrapper
 */
export class ModelQueryBuilder<T extends Model> {
    private eagerLoad: Map<string, ((q: QueryBuilder) => void) | null> = new Map();

    constructor(
        private queryBuilder: QueryBuilder,
        private modelClass: new () => T
    ) { }

    /**
     * Get all records
     */
    async all(): Promise<T[]> {
        const results = await this.queryBuilder.get();
        const models = results.map(data => this.hydrate(data));
        return await this.loadRelations(models);
    }

    /**
     * Find a record by ID
     */
    async find(id: any): Promise<T | null> {
        const instance = new this.modelClass();
        const result = await this.queryBuilder
            .where(instance['getPrimaryKey'](), id)
            .first();

        if (!result) {
            return null;
        }

        const model = this.hydrate(result);
        await this.loadRelations([model]);
        return model;
    }

    /**
     * Create a new record
     */
    async create(data: Record<string, any>): Promise<T> {
        let instance = new this.modelClass();

        if (instance.usesTimestamps()) {
            const now = new Date();
            data['created_at'] = data['created_at'] || now;
            data['updated_at'] = data['updated_at'] || now;
        }

        const result = await this.queryBuilder.insert(data);
        instance = this.hydrate(data);

        // Set the primary key if it was auto-generated
        const primaryKey = instance['getPrimaryKey']();
        if (result && result.insertId && !data[primaryKey]) {
            instance.setAttribute(primaryKey, result.insertId);
        }

        instance.setExists(true);
        instance['syncOriginal']();
        return instance;
    }

    /**
     * Insert a record or multiple records natively (Bulk Insert)
     */
    async insert(data: Record<string, any> | Record<string, any>[]): Promise<any> {
        return await this.queryBuilder.insert(data);
    }

    /**
     * Add a where clause
     */
    where(column: string, operator: any, value?: any): this {
        this.queryBuilder.where(column, operator, value);
        return this;
    }

    /**
     * Add an OR where clause
     */
    orWhere(column: string, operator: any, value?: any): this {
        this.queryBuilder.orWhere(column, operator, value);
        return this;
    }

    /**
     * Add a where in clause
     */
    whereIn(column: string, values: any[]): this {
        this.queryBuilder.whereIn(column, values);
        return this;
    }

    /**
     * Add a where not in clause
     */
    whereNotIn(column: string, values: any[]): this {
        this.queryBuilder.whereNotIn(column, values);
        return this;
    }

    /**
     * Add a where null clause
     */
    whereNull(column: string): this {
        this.queryBuilder.whereNull(column);
        return this;
    }

    /**
     * Add a where not null clause
     */
    whereNotNull(column: string): this {
        this.queryBuilder.whereNotNull(column);
        return this;
    }

    /**
     * Add an order by clause
     */
    orderBy(column: string, direction?: 'asc' | 'desc'): this {
        this.queryBuilder.orderBy(column, direction);
        return this;
    }

    /**
     * Add a limit clause
     */
    limit(limit: number): this {
        this.queryBuilder.limit(limit);
        return this;
    }

    /**
     * Add an offset clause
     */
    offset(offset: number): this {
        this.queryBuilder.offset(offset);
        return this;
    }

    /**
     * Update records
     */
    async update(data: Record<string, any>): Promise<number> {
        return await this.queryBuilder.update(data);
    }

    /**
     * Delete a record by ID
     */
    async delete(id?: any): Promise<number> {
        if (id !== undefined) {
            const instance = new this.modelClass();
            this.queryBuilder.where(instance['getPrimaryKey'](), id);
        }
        return await this.queryBuilder.delete();
    }

    /**
     * Get the first record
     */
    async first(): Promise<T | null> {
        const result = await this.queryBuilder.first();
        if (!result) {
            return null;
        }

        const model = this.hydrate(result);
        await this.loadRelations([model]);
        return model;
    }

    /**
     * Get records
     */
    async get(): Promise<T[]> {
        const results = await this.queryBuilder.get();
        const models = results.map(data => this.hydrate(data));
        return await this.loadRelations(models);
    }

    /**
     * Get the count of records
     */
    async count(column?: string): Promise<number> {
        return await this.queryBuilder.count(column);
    }

    /**
     * Cache the query results
     */
    cache(ttl: number, key?: string): this {
        this.queryBuilder.cache(ttl, key);
        return this;
    }

    /**
     * Eager load relationships
     */
    with(relations: string | string[] | Record<string, (q: QueryBuilder) => void>): this {
        if (typeof relations === 'string') {
            this.eagerLoad.set(relations, null);
        } else if (Array.isArray(relations)) {
            relations.forEach(rel => this.eagerLoad.set(rel, null));
        } else {
            Object.entries(relations).forEach(([rel, callback]) => {
                this.eagerLoad.set(rel, callback);
            });
        }
        return this;
    }

    /**
     * Include subqueries to count given relationships
     */
    withCount(relations: string | string[]): this {
        const relationNames = Array.isArray(relations) ? relations : [relations];
        const dummy = new this.modelClass();
        const outerTable = (dummy as any).getTable();

        for (const rel of relationNames) {
            if (typeof (dummy as any)[rel] !== 'function') {
                throw new Error(`Relation ${rel} does not exist on model ${dummy.constructor.name}`);
            }

            const relationInstance = (dummy as any)[rel]();
            if (typeof relationInstance.getRelationCountQuery !== 'function') {
                throw new Error(`Relation ${rel} does not support withCount natively`);
            }

            const { sql, bindings } = relationInstance.getRelationCountQuery(outerTable);
            this.queryBuilder.selectRaw(`${sql} AS ${rel}_count`, bindings);
        }

        return this;
    }

    /**
     * Add a basic where clause using a related model (WHERE EXISTS)
     */
    whereHas(relation: string, callback?: (q: QueryBuilder) => void): this {
        const dummy = new this.modelClass();
        const outerTable = (dummy as any).getTable();

        if (typeof (dummy as any)[relation] !== 'function') {
            throw new Error(`Relation ${relation} does not exist on model ${dummy.constructor.name}`);
        }

        const relationInstance = (dummy as any)[relation]();

        this.queryBuilder.whereExists((q) => {
            const { sql, bindings } = relationInstance.getRelationCountQuery(outerTable);
            // Replace SELECT COUNT(*) with SELECT 1 for EXISTS optimization
            const existsSql = sql.replace(/^\(SELECT COUNT\(\*\)/i, '(SELECT 1');
            q.selectRaw(existsSql.slice(1, -1), bindings); // remove outer parens because whereExists adds them

            if (callback) {
                callback(q);
            }
        });

        return this;
    }

    /**
     * Add a basic where clause for absence of a related model (WHERE NOT EXISTS)
     */
    whereDoesntHave(relation: string, callback?: (q: QueryBuilder) => void): this {
        const dummy = new this.modelClass();
        const outerTable = (dummy as any).getTable();

        if (typeof (dummy as any)[relation] !== 'function') {
            throw new Error(`Relation ${relation} does not exist on model ${dummy.constructor.name}`);
        }

        const relationInstance = (dummy as any)[relation]();

        this.queryBuilder.whereNotExists((q) => {
            const { sql, bindings } = relationInstance.getRelationCountQuery(outerTable);
            const existsSql = sql.replace(/^\(SELECT COUNT\(\*\)/i, '(SELECT 1');
            q.selectRaw(existsSql.slice(1, -1), bindings);

            if (callback) {
                callback(q);
            }
        });

        return this;
    }

    /**
     * Paginate the query results
     */
    async paginate(page: number = 1, perPage: number = 15, path: string = '/'): Promise<{ data: T[], meta: any, links: any }> {
        const paginatedResult = await this.queryBuilder.paginate(page, perPage, path);

        // Map and load relations
        const models = paginatedResult.data.map(data => this.hydrate(data));
        const finalModels = await this.loadRelations(models);

        return {
            data: finalModels,
            meta: paginatedResult.meta,
            links: paginatedResult.links
        };
    }

    /**
     * Paginate the query results without counting total pages
     */
    async simplePaginate(page: number = 1, perPage: number = 15, path: string = '/'): Promise<{ data: T[], meta: any, links: any }> {
        const paginatedResult = await this.queryBuilder.simplePaginate(page, perPage, path);

        // Map and load relations
        const models = paginatedResult.data.map(data => this.hydrate(data));
        const finalModels = await this.loadRelations(models);

        return {
            data: finalModels,
            meta: paginatedResult.meta,
            links: paginatedResult.links
        };
    }

    /**
     * Cursor paginate for high performance
     */
    async cursorPaginate(cursor: string | null = null, perPage: number = 15, cursorColumn: string = 'id', path: string = '/'): Promise<{ data: T[], meta: any, links: any }> {
        const paginatedResult = await this.queryBuilder.cursorPaginate(cursor, perPage, cursorColumn, path);

        // Map and load relations
        const models = paginatedResult.data.map(data => this.hydrate(data));
        const finalModels = await this.loadRelations(models);

        return {
            data: finalModels,
            meta: paginatedResult.meta,
            links: paginatedResult.links
        };
    }

    /**
     * Chunk the query results
     */
    async chunk(count: number, callback: (models: T[], page: number) => Promise<boolean | void>): Promise<boolean> {
        return this.queryBuilder.chunk(count, async (results, page) => {
            const models = results.map(data => this.hydrate(data));
            const finalModels = await this.loadRelations(models);
            return callback(finalModels, page);
        });
    }

    /**
     * Hydrate a model instance from data
     */
    private hydrate(data: Record<string, any>): T {
        const instance = new this.modelClass();
        instance['attributes'] = { ...data };
        instance['original'] = { ...data };
        instance['exists'] = true;
        return instance;
    }

    /**
     * Load eager loaded relationships
     */
    private async loadRelations(models: T[]): Promise<T[]> {
        if (models.length === 0 || this.eagerLoad.size === 0) {
            return models;
        }

        for (const [relation, callback] of this.eagerLoad.entries()) {
            for (const model of models) {
                if (typeof (model as any)[relation] === 'function') {
                    const relationInstance = (model as any)[relation]();

                    // Apply callback if provided
                    if (callback && relationInstance.query) {
                        callback(relationInstance.query());
                    }

                    const result = await relationInstance.get();
                    model.setRelation(relation, result);
                }
            }
        }

        return models;
    }
}
