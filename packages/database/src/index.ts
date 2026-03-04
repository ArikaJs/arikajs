// Core exports
export { Database } from './Database';
export { DatabaseManager } from './DatabaseManager';

// DB Facade alias (for convenience)
export { Database as DB } from './Database';

// Connections
export { MySQLConnection } from './Connections/MySQLConnection';
export { PostgreSQLConnection } from './Connections/PostgreSQLConnection';
export { SQLiteConnection } from './Connections/SQLiteConnection';
export { MongoDBConnection } from './Connections/MongoDBConnection';

// Query Builder
export { QueryBuilder } from './Query/QueryBuilder';
export { Expression } from './Query/Expression';

// Model
export { Model, ModelQueryBuilder } from './Model/Model';
export {
    HasOne, HasMany, BelongsTo, BelongsToMany,
    HasOneThrough, HasManyThrough,
    MorphOne, MorphMany, MorphTo,
    Relation,
} from './Model/Relations';
export type { PivotData } from './Model/Relations';
export { withSoftDeletes, SoftDeletes } from './Model/SoftDeletes';
export { ObserverRegistry } from './Model/Observer';
export type { ModelObserver, ObserverEvent } from './Model/Observer';
export { GlobalScopeRegistry, CallbackGlobalScope } from './Model/GlobalScope';
export type { GlobalScope } from './Model/GlobalScope';

// Transactions
export { TransactionManager } from './Transactions/TransactionManager';

// Query Logging
export { QueryLogger } from './Query/QueryLogger';
export type { QueryLog } from './Query/QueryLogger';

// Schema
export { Schema, TableBlueprint, ColumnDefinition, ForeignKeyDefinition } from './Schema/Schema';
export { SchemaBuilder } from './Schema/SchemaBuilder';

// Migrations
export { Migration } from './Migrations/Migration';
export { Migrator } from './Migrations/Migrator';

// Seeders
export { Seeder } from './Seeders/Seeder';
export { SeedRunner } from './Seeders/SeedRunner';

// Contracts
export type {
    Connection,
    ConnectionConfig,
    DatabaseConfig,
    QueryBuilder as QueryBuilderInterface,
} from './Contracts/Database';

export type {
    Blueprint,
    ColumnDefinition as ColumnDefinitionInterface,
    ForeignKeyDefinition as ForeignKeyDefinitionInterface,
    SchemaCallback,
} from './Contracts/Schema';
