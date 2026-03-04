# @arikajs/database

<div align="center">

<img src="../cli/templates/app/public/assets/img/logo.png" alt="ArikaJS Logo" width="400">

</div>

**@arikajs/database** is the official database layer for the ArikaJS framework.  
It provides a powerful, extensible, and framework-integrated database system with an elegant, fluent API — but designed natively for **Node.js & TypeScript**.

This package powers **DB facade**, **Models**, **Migrations**, and **Query Builder** across all ArikaJS applications.

---

## ✨ Features

### ✅ Available (v0.x)
- ✅ Multiple database connections
- ✅ MySQL, PostgreSQL, SQLite, & MongoDB support
- ✅ Fluent Query Builder
- ✅ Static Model querying
- ✅ Instance-style Models (Active Record)
- ✅ Relationships (hasOne, hasMany, belongsTo, belongsToMany)
- ✅ Eager Loading
- ✅ Query Scopes
- ✅ Soft Deletes
- ✅ DB Facade (`DB.table()`)
- ✅ Migrations & Schema Builder
- ✅ Database Seeders
- ✅ Framework-integrated configuration
- ✅ TypeScript-first design
- ✅ Works with native ArikaJS DI container
- ✅ Query result caching
- ✅ Query Builder & Model Pagination
- ✅ Attribute Casting & Magic Accessors/Mutators
- ✅ Bulk Operations (Bulk Insert)
- ✅ Connection Pooling & Read/Write Splitting
- ✅ Transactions (with nested savepoints)
- ✅ Model Observers (lifecycle hooks)
- ✅ Query Logging & Debug Mode
- ✅ Global Scopes

---

## 📦 Supported Drivers

| Driver | Status |
| --- | --- |
| MySQL | ✅ Supported |
| PostgreSQL | ✅ Supported |
| SQLite | ✅ Supported |
| MongoDB | ✅ Supported |

---

## 📦 Installation

```bash
npm install @arikajs/database
```

---

## ⚙️ Configuration

**config/database.ts**

```typescript
import { env } from '@arikajs/config';

export default {
  default: env('DB_CONNECTION', 'mysql'),

  connections: {
    mysql: {
      driver: 'mysql',
      host: env('DB_HOST', '127.0.0.1'),
      port: env('DB_PORT', 3306),
      database: env('DB_DATABASE', 'arikajs'),
      username: env('DB_USERNAME', 'root'),
      password: env('DB_PASSWORD', ''),
    },

    pgsql: {
      driver: 'pgsql',
      host: env('DB_HOST', '127.0.0.1'),
      port: env('DB_PORT', 5432),
      database: env('DB_DATABASE', 'arikajs'),
      username: env('DB_USERNAME', 'postgres'),
      password: env('DB_PASSWORD', ''),
    },

    sqlite: {
      driver: 'sqlite',
      database: env('DB_DATABASE', 'database.sqlite'),
    },

    mongodb: {
      driver: 'mongodb',
      host: env('DB_HOST', '127.0.0.1'),
      port: env('DB_PORT', 27017),
      database: env('DB_DATABASE', 'arikajs'),
      username: env('DB_USERNAME', ''),
      password: env('DB_PASSWORD', ''),
    },
  },
};
```

---

## 🧠 Usage

### DB Facade (Query Builder)

```typescript
import { DB } from '@arikajs/database';

const users = await DB.table('users')
  .where('active', true)
  .orderBy('id', 'desc')
  .get();

await DB.table('users').insert({
  name: 'John',
  email: 'john@example.com',
});
```

### 🧬 Models (Static Style)

```typescript
import { Model } from '@arikajs/database';

export class User extends Model {
  static table = 'users';
}

const users = await User.where('active', true).get();
const user = await User.find(1);
```

### 💾 Instance-style Models

```typescript
// Create new record
const user = new User();
user.name = 'John';
user.email = 'john@example.com';
await user.save();

// Update existing record
const user = await User.find(1);
user.name = 'Updated Name';
await user.save();

// Delete record
await user.deleteInstance();

// Dirty checking
user.name = 'New Name';
console.log(user.isDirty()); // true
console.log(user.getDirty()); // { name: 'New Name' }
```

### 🪄 Attribute Casting & Magic Accessors/Mutators
ArikaJS Model system supports defining exact types your database inputs should cast to. Using a Proxy behind the scenes, you can retrieve any attribute implicitly and add overrides (mutators/accessors).
```typescript
class User extends Model {
  // Instruct ArikaJS to cast these properties when saving/retrieving
  protected casts = {
    is_active: 'boolean',
    metadata: 'json',
    last_login: 'datetime'
  };

  // Mutator: Set Password Hash
  setPasswordAttribute(value: string) {
    this.attributes['password'] = hash(value);
  }

  // Accessor: Get Full Name
  getFullNameAttribute() {
    return `${this.first_name} ${this.last_name}`;
  }
}

const user = new User();
user.is_active = true; // Implicit proxy saving!
user.password = 'my_secure_pass'; // Triggers setPasswordAttribute!
console.log(user.full_name); // Magic accessor triggered!
```

### 🔗 Relationships

```typescript
class User extends Model {
  static table = 'users';

  posts() {
    return this.hasMany(Post, 'user_id');
  }

  profile() {
    return this.hasOne(Profile, 'user_id');
  }
}

class Post extends Model {
  static table = 'posts';

  author() {
    return this.belongsTo(User, 'user_id');
  }

  tags() {
    return this.belongsToMany(Tag, 'post_tag', 'post_id', 'tag_id');
  }
}

// Using relationships
const user = await User.find(1);
const posts = await user.posts().get();
const profile = await user.profile().get();
```

### ⚡ Eager Loading

```typescript
// Eager load relationships
const users = await User.with('posts').get();

// Eager load with constraints
const users = await User.with({
  posts: q => q.where('published', true),
}).get();

// Multiple relationships
const users = await User.with(['posts', 'profile']).get();
```

### 🎯 Query Scopes

```typescript
class User extends Model {
  static table = 'users';

  static active<T extends Model>(this: typeof Model) {
    return this.query<T>().where('active', true);
  }

  static verified<T extends Model>(this: typeof Model) {
    return this.query<T>().where('email_verified', true);
  }
}

// Using scopes
const activeUsers = await User.active().get();
const verifiedActiveUsers = await User.active().verified().get();
```

### 🗑 Soft Deletes

```typescript
import { Model, withSoftDeletes } from '@arikajs/database';

class User extends withSoftDeletes(Model) {
  static table = 'users';
}

// Soft delete (sets deleted_at timestamp)
await User.delete(1);

// Get all records including soft deleted
const allUsers = await User.withTrashed().get();

// Get only soft deleted records
const trashedUsers = await User.onlyTrashed().get();

// Restore a soft deleted record
await User.restore(1);

// Permanently delete
await User.forceDelete(1);
```

### 🧱 Schema Builder & Migrations

ArikaJS offers a fluent schema builder for creating and altering tables.

```typescript
import { Schema } from '@arikajs/database';

// 1. Create a table
await Schema.create('users', (table) => {
    table.id();
    table.string('name');
    table.string('email').unique();
    table.boolean('is_active').default(true);
    table.timestamps();
});

// 2. Alter an existing table
await Schema.table('users', (table) => {
    table.string('phone_number').nullable(); // Adds phone_number
    table.dropColumn('is_active');           // Drops a column
    table.index(['name', 'email']);          // Adds a compound index
});

// 3. Drop tables
await Schema.dropIfExists('users');
```

(Note: A CLI tool to automatically generate and run these migrations is planned: `arika make:migration create_users_table`).

---

## 🏗 Architecture

```text
database/
├── src/
│   ├── Connections
│   │   ├── MongoDBConnection.ts
│   │   ├── MySQLConnection.ts
│   │   ├── PostgreSQLConnection.ts
│   │   └── SQLiteConnection.ts
│   ├── Contracts
│   │   ├── Database.ts
│   │   └── Schema.ts
│   ├── Migrations
│   │   ├── Migration.ts
│   │   └── Migrator.ts
│   ├── Model
│   │   ├── GlobalScope.ts
│   │   ├── Model.ts
│   │   ├── Observer.ts
│   │   ├── Relations.ts
│   │   └── SoftDeletes.ts
│   ├── Query
│   │   ├── Expression.ts
│   │   ├── QueryBuilder.ts
│   │   └── QueryLogger.ts
│   ├── Schema
│   │   ├── Grammars
│   │   │   ├── Grammar.ts
│   │   │   ├── MySQLGrammar.ts
│   │   │   ├── PostgreSQLGrammar.ts
│   │   │   └── SQLiteGrammar.ts
│   │   ├── Schema.ts
│   │   └── SchemaBuilder.ts
│   ├── Seeders
│   │   ├── Seeder.ts
│   │   └── SeedRunner.ts
│   ├── Transactions
│   │   └── TransactionManager.ts
│   ├── Database.ts
│   ├── DatabaseManager.ts
│   └── index.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚧 Planned Features (Roadmap)

The following features are designed and planned and will be introduced incrementally **without breaking existing APIs**.

### 🎪 Model Events
```typescript
class User extends Model {
  static booted() {
    this.creating((user) => {
      user.uuid = generateUuid();
    });
    
    this.updated((user) => {
      // Clear cache, send notifications, etc.
    });
  }
}
```

### ⚡ Query Result Caching (Inline Caching)
Caching is natively supported inline using the `.cache()` builder method. It integrates directly with `@arikajs/cache` when registered inside the framework.
```typescript
const users = await User.where('active', true)
  .cache(3600) // Cache for 1 hour
  .get();
```

### 📄 Pagination
Quickly retrieve paginated models using `.paginate()`. It directly queries out metadata alongside the specific models.
```typescript
const { data, meta } = await User.where('status', 'active').paginate(1, 15);

// Output:
// {
//    data: [...], // Array of 15 User model instances
//    meta: {
//       total: 50,
//       per_page: 15,
//       current_page: 1,
//       last_page: 4,
//       first_page: 1
//    }
// }
```

### 🏁 Bulk Operations
Executing a bulk operation gives you massive optimization boosts across a large SaaS platform. ArikaJS simplifies doing arrays of records sequentially.
```typescript
await User.insert([
  { first_name: 'John', last_name: 'Doe' },
  { first_name: 'Jane', last_name: 'Smith' },
  { first_name: 'William', last_name: 'James' }
]);
```

### 🔀 Connection Pooling & Read/Write Splitting
Scale-out your database layer without touching any model or query code. ArikaJS automatically routes `SELECT` queries to the read replica pool and `INSERT/UPDATE/DELETE` to the write master.
```typescript
// config/database.ts
{
  driver: 'mysql',
  database: 'myapp',
  // One write master
  write: { host: 'db-master.internal', username: 'root', password: 'secret' },
  // Multiple read replicas — one is chosen at random per query
  read: [
    { host: 'db-replica-1.internal' },
    { host: 'db-replica-2.internal' },
  ],
  pool: { min: 2, max: 20 }
}
// No code changes needed — ArikaJS routes automatically!
```

### 💼 Transactions
Use `Database.transaction()` for clean, auto-rollback-on-error transactions. Nested calls automatically use SQL **savepoints**.
```typescript
await Database.transaction(async (trx) => {
  await DB.table('accounts').where('id', fromId).update({ balance: DB.raw('balance - 500') });
  await DB.table('accounts').where('id', toId).update({ balance: DB.raw('balance + 500') });
  await DB.table('transfers').insert({ from_id: fromId, to_id: toId, amount: 500 });
});
// If any statement throws, the entire block is rolled back automatically!

// Manual control:
const txm = await Database.getTransactionManager();
await txm.begin();
try {
  await txm.commit();
} catch {
  await txm.rollback();
}
```

### 👁️ Model Observers
Keep your models lean. Attach lifecycle listeners externally without polluting the model with inline logic.
```typescript
class UserObserver {
  async creating(user: User) {
    user.role = user.role ?? 'member';
  }

  async created(user: User) {
    await EmailService.sendWelcomeEmail(user.email);
  }

  // Return false to CANCEL the operation
  async deleting(user: User) {
    if (user.role === 'admin') return false; // Block admin deletions!
  }

  async deleted(user: User) {
    await AuditLog.record(`User ${user.id} was deleted`);
  }
}

// Register once in a ServiceProvider or boot file:
User.observe(new UserObserver());
```

### 🔍 Query Logging & Debug Mode
Introspect every SQL query fired — perfect for debugging slow endpoints or verifying your query plans.
```typescript
// Enable logging:
Database.enableQueryLog();

await User.where('status', 'active').get();
await Post.where('user_id', 1).limit(5).get();

// Inspect queries:
const logs = Database.getQueryLog();
console.log(logs);
// [
//   { sql: 'SELECT * FROM users WHERE status = ?', bindings: ['active'], time: 1.2, timestamp: Date },
//   { sql: 'SELECT * FROM posts WHERE user_id = ? LIMIT ?', bindings: [1, 5], time: 0.8, timestamp: Date },
// ]

// Or listen live:
QueryLogger.listen((log) => {
  if (log.time > 100) console.warn(`[SLOW QUERY] ${log.sql} (${log.time}ms)`);
});

Database.flushQueryLog(); // Clear when done
```

### 🌐 Global Scopes
Automatic query constraints applied to every query without the caller needing to remember them — ideal for multi-tenancy and similar patterns.
```typescript
// Register a scope at boot time:
User.addGlobalScope('active_only', (builder) => {
  builder.where('status', 'active');
});

// From now on ALL User queries are scoped:
await User.all(); // SELECT * FROM users WHERE status = 'active'
await User.where('role', 'admin').get(); // Adds status constraint automatically

// Escape the scope when needed:
await User.withoutGlobalScopes().all(); // SELECT * FROM users (no scope)

// Or use a full class:
class TenantScope implements GlobalScope {
  constructor(private tenantId: number) {}
  apply(builder: any) {
    builder.where('tenant_id', this.tenantId);
  }
}
Post.addGlobalScope('tenant', new TenantScope(currentTenantId));
```

### 🔗 Advanced Relationships

ArikaJS supports advanced relationship types, bringing you power usually found only in heavy, complex ORMs.

#### Through Relationships
Relate models through an intermediate model.
```typescript
class Country extends Model {
  // Country has many Posts, through Users
  posts() {
    return this.hasManyThrough(Post, User, 'country_id', 'user_id');
  }
}
// Get all posts for users in a specific country
const posts = await country.posts().get();
```

#### Polymorphic Relationships
A model can belong to more than one other model on a single association.
```typescript
class Image extends Model {
  imageable() {
    return this.morphTo('imageable');
  }
}

class Post extends Model {
  image() {
    return this.morphOne(Image, 'imageable');
  }
}

class User extends Model {
  image() {
    return this.morphOne(Image, 'imageable');
  }
}

// Inserting polymorphic models
const post = await Post.find(1);
await post.image().create({ url: '/foo.png' }); // sets imageable_id=1, imageable_type='Post'
```

#### Pivot Table Operations (Many-to-Many)
ArikaJS provides robust helpers for `BelongsToMany` pivot tables:
```typescript
// 1. Fetching extra pivot columns:
class User extends Model {
  roles() {
    return this.belongsToMany(Role).withPivot('expires_at', 'assigned_by');
  }
}
const user = await User.find(1);
const firstRole = (await user.roles().get())[0];
console.log(firstRole.pivot.expires_at);

// 2. Modifying the relationship (Attach/Detach/Sync/Toggle)
const roleId = 5;

// Simply add the link:
await user.roles().attach(roleId, { assigned_by: 'admin' });

// Remove the link:
await user.roles().detach(roleId);

// Sync: Only keep these exact IDs and remove the rest
await user.roles().sync([1, 2, 3]);

// Toggle: Add if missing, remove if present
await user.roles().toggle([1, 4]);
```

#### Relationship Counting
You can dynamically count the number of related objects without loading them simply by using `withCount()`. ArikaJS uses optimized subqueries.
```typescript
const posts = await Post.withCount('comments').all();
console.log(posts[0].comments_count); // e.g: 4

// Count multiple relationships at once
const users = await User.withCount(['posts', 'followers']).all();
console.log(users[0].posts_count);
```

### 🔍 Enterprise ORM Features

#### Advanced Relationship Filtering
Filter parents based on the existence of children using `whereHas` or `whereDoesntHave`. This runs powerful `EXISTS` subqueries behind the scenes:
```typescript
// Fetch users who have at least one published post
const activeBloggers = await User.whereHas('posts', q => q.where('status', 'published')).get();

// Fetch users with no comments
const lurkers = await User.whereDoesntHave('comments').get();
```

#### API-Ready Pagination
Simply call `.paginate()`, `.simplePaginate()`, or `.cursorPaginate()` to instantly receive a JSON response structure that is ready to be sent to your frontend:
```typescript
// Traditional offset pagination (page 2, 15 items per page)
const results = await User.paginate(2, 15, '/api/users');
/*
{
  "data": [...],
  "meta": { "total": 100, "current_page": 2, "last_page": 7, ... },
  "links": { "prev_page_url": "/api/users?page=1", "next_page_url": "/api/users?page=3" }
}
*/

// Ultra-fast Cursor pagination for infinite scrolling (WHERE id > last_id LIMIT)
const infinite = await User.cursorPaginate('cursor_id_here', 15);
```

#### Memory-Safe Chunking
If you need to process tens of thousands of records, `all()` will crash your Node process. Use `chunk` to iterate over them safely:
```typescript
// Fetches 1000 users at a time, keeping RAM usage perfectly flat
await User.chunk(1000, async (users, page) => {
    for (const user of users) {
        await emailService.sendNewsletter(user.email);
    }
});
```

#### Other Advanced Features include:
- Subqueries
- Union queries
- Raw expressions
- Database-specific functions

---

## 🧠 Design Philosophy

**"Power without magic."**

- One Query Builder
- No hidden globals
- Predictable SQL
- Elegant DX, Node.js performance

---

## 🔗 Framework Integration

- **@arikajs/foundation** → DI & lifecycle
- **@arikajs/config** → .env & config loading
- **@arikajs/cli** → migrations & generators
- **arikajs** → meta framework wiring

---

## 🧭 Versioning Strategy

- **0.x** → API stabilisation
- **1.0** → Stable contracts
- No breaking changes without major version bump

---

## 📄 License

MIT License © ArikaJS
