import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DatabaseManager, QueryBuilder, Model, DB, Database } from '../src';

describe('Database Package - Full Implementation', () => {
    describe('DatabaseManager', () => {
        it('should create a DatabaseManager instance', () => {
            const config = {
                default: 'mysql',
                connections: {
                    mysql: {
                        driver: 'mysql' as const,
                        host: '127.0.0.1',
                        port: 3306,
                        database: 'test',
                        username: 'root',
                        password: 'password',
                    },
                },
            };

            const manager = new DatabaseManager(config);
            assert.ok(manager instanceof DatabaseManager);
        });

        it('should create a query builder', () => {
            const config = {
                default: 'mysql',
                connections: {
                    mysql: {
                        driver: 'mysql' as const,
                        host: '127.0.0.1',
                        port: 3306,
                        database: 'test',
                        username: 'root',
                        password: 'password',
                    },
                },
            };

            const manager = new DatabaseManager(config);
            const queryBuilder = manager.table('users');
            assert.ok(queryBuilder instanceof QueryBuilder);
        });
    });

    describe('QueryBuilder API', () => {
        it('should have all query builder methods', () => {
            const config = {
                default: 'mysql',
                connections: {
                    mysql: {
                        driver: 'mysql' as const,
                        host: '127.0.0.1',
                        port: 3306,
                        database: 'test',
                        username: 'root',
                        password: 'password',
                    },
                },
            };

            const manager = new DatabaseManager(config);
            const queryBuilder = manager.table('users');

            // Verify all methods exist
            assert.ok(typeof queryBuilder.where === 'function');
            assert.ok(typeof queryBuilder.orWhere === 'function');
            assert.ok(typeof queryBuilder.whereIn === 'function');
            assert.ok(typeof queryBuilder.whereNotIn === 'function');
            assert.ok(typeof queryBuilder.whereNull === 'function');
            assert.ok(typeof queryBuilder.whereNotNull === 'function');
            assert.ok(typeof queryBuilder.select === 'function');
            assert.ok(typeof queryBuilder.orderBy === 'function');
            assert.ok(typeof queryBuilder.limit === 'function');
            assert.ok(typeof queryBuilder.offset === 'function');
            assert.ok(typeof queryBuilder.get === 'function');
            assert.ok(typeof queryBuilder.first === 'function');
            assert.ok(typeof queryBuilder.insert === 'function');
            assert.ok(typeof queryBuilder.update === 'function');
            assert.ok(typeof queryBuilder.delete === 'function');
            assert.ok(typeof queryBuilder.count === 'function');
        });
    });

    describe('DB Facade', () => {
        it('should export DB as an alias for Database', () => {
            assert.strictEqual(DB, Database);
        });

        it('should have static methods', () => {
            assert.ok(typeof DB.table === 'function');
            assert.ok(typeof DB.transaction === 'function');
            assert.ok(typeof DB.connection === 'function');
            assert.ok(typeof DB.setManager === 'function');
        });
    });

    describe('Model - Static API', () => {
        class User extends Model {
            static table = 'users';
        }

        it('should have static query methods', () => {
            assert.ok(typeof User.query === 'function');
            assert.ok(typeof User.find === 'function');
            assert.ok(typeof User.all === 'function');
            assert.ok(typeof User.where === 'function');
            assert.ok(typeof User.orWhere === 'function');
            assert.ok(typeof User.whereIn === 'function');
            assert.ok(typeof User.whereNotIn === 'function');
            assert.ok(typeof User.whereNull === 'function');
            assert.ok(typeof User.whereNotNull === 'function');
            assert.ok(typeof User.orderBy === 'function');
            assert.ok(typeof User.limit === 'function');
            assert.ok(typeof User.offset === 'function');
            assert.ok(typeof User.create === 'function');
            assert.ok(typeof User.first === 'function');
            assert.ok(typeof User.get === 'function');
            assert.ok(typeof User.count === 'function');
        });

        it('should support method chaining', () => {
            // Set up a mock database manager
            const config = {
                default: 'mysql',
                connections: {
                    mysql: {
                        driver: 'mysql' as const,
                        host: '127.0.0.1',
                        port: 3306,
                        database: 'test',
                        username: 'root',
                        password: 'password',
                    },
                },
            };

            const manager = new DatabaseManager(config);
            Database.setManager(manager);

            // Test chaining
            const queryBuilder = User.where('active', true).orderBy('id', 'desc');
            assert.ok(queryBuilder);
        });
    });

    describe('Model Query Builder', () => {
        class User extends Model {
            static table = 'users';
        }

        it('should have all query builder methods on ModelQueryBuilder', () => {
            const config = {
                default: 'mysql',
                connections: {
                    mysql: {
                        driver: 'mysql' as const,
                        host: '127.0.0.1',
                        port: 3306,
                        database: 'test',
                        username: 'root',
                        password: 'password',
                    },
                },
            };

            const manager = new DatabaseManager(config);
            Database.setManager(manager);

            const queryBuilder = User.query();

            assert.ok(typeof queryBuilder.where === 'function');
            assert.ok(typeof queryBuilder.orWhere === 'function');
            assert.ok(typeof queryBuilder.whereIn === 'function');
            assert.ok(typeof queryBuilder.whereNotIn === 'function');
            assert.ok(typeof queryBuilder.whereNull === 'function');
            assert.ok(typeof queryBuilder.whereNotNull === 'function');
            assert.ok(typeof queryBuilder.orderBy === 'function');
            assert.ok(typeof queryBuilder.limit === 'function');
            assert.ok(typeof queryBuilder.offset === 'function');
            assert.ok(typeof queryBuilder.all === 'function');
            assert.ok(typeof queryBuilder.find === 'function');
            assert.ok(typeof queryBuilder.create === 'function');
            assert.ok(typeof queryBuilder.update === 'function');
            assert.ok(typeof queryBuilder.delete === 'function');
            assert.ok(typeof queryBuilder.first === 'function');
            assert.ok(typeof queryBuilder.get === 'function');
            assert.ok(typeof queryBuilder.count === 'function');
        });
    });

    describe('PostgreSQL Support', () => {
        it('should support PostgreSQL configuration', () => {
            const config = {
                default: 'pgsql',
                connections: {
                    pgsql: {
                        driver: 'pgsql' as const,
                        host: '127.0.0.1',
                        port: 5432,
                        database: 'test',
                        username: 'postgres',
                        password: 'password',
                    },
                },
            };

            const manager = new DatabaseManager(config);
            assert.ok(manager instanceof DatabaseManager);
        });
    });

    describe('Multiple Connections', () => {
        it('should support multiple database connections', () => {
            const config = {
                default: 'mysql',
                connections: {
                    mysql: {
                        driver: 'mysql' as const,
                        host: '127.0.0.1',
                        port: 3306,
                        database: 'test',
                        username: 'root',
                        password: 'password',
                    },
                    pgsql: {
                        driver: 'pgsql' as const,
                        host: '127.0.0.1',
                        port: 5432,
                        database: 'test',
                        username: 'postgres',
                        password: 'password',
                    },
                },
            };

            const manager = new DatabaseManager(config);
            assert.ok(manager instanceof DatabaseManager);

            // Should be able to create query builders for different connections
            const mysqlQuery = manager.table('users', 'mysql');
            const pgsqlQuery = manager.table('users', 'pgsql');

            assert.ok(mysqlQuery instanceof QueryBuilder);
            assert.ok(pgsqlQuery instanceof QueryBuilder);
        });
    });
});
