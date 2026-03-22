# ArikaJS Showcase App: "FlowBoard"

## 🎯 The Goal
Before we add new features to ArikaJS, we need a "North Star" application that tests every single component of the framework in a real-world scenario. 

"FlowBoard" will be a **Project Management & Task Board Application** (similar to Trello or Linear). It is complex enough to stress-test the framework, but focused enough to be built quickly. It will act as the ultimate integration test and a reference implementation for new developers.

---

## 🛠️ Framework Features Put to the Test

To ensure ArikaJS is truly production-ready, FlowBoard will intentionally utilize every major package:

### 1. HTTP & Routing (`@arikajs/router`, `@arikajs/http`)
- **API Routes**: RESTful endpoints for CRUD operations on boards, lists, and tasks.
- **Web Routes**: Server-side rendered views for the public landing page and dashboard shell.
- **Middleware**: Deeply nested routing groups with middleware for Authentication, Rate Limiting, and CORS.

### 2. Authentication & Authorization (`@arikajs/auth`, `@arikajs/authorization`)
- **Multi-Guard Setup**: 
  - `SessionGuard` for the web dashboard.
  - `JwtGuard` or `TokenGuard` for the API endpoints.
- **Policies / Gates**: Example: "Only the board owner can delete a board, but members can add tasks."
- **Password Resets**: Utilizing the existing password broker.

### 3. Database & ORM (`@arikajs/database`)
- **Complex Relationships**: 
  - `User` 1:N `Board`
  - `Board` 1:N `List`
  - `List` 1:N `Task`
  - `Task` N:N `User` (Assignees)
- **Migrations & Seeding**: A full migration suite to build the schema from scratch.

### 4. Background Jobs & Queues (`@arikajs/queue`, `@arikajs/scheduler`)
- **Queued Tasks**: When a user is assigned to a task, push a `SendAssigneeNotificationJob` to the queue so the HTTP response is instant.
- **Scheduler**: A cron job that runs nightly to delete "Archived" boards over 30 days old.

### 5. Mail & Events (`@arikajs/mail`, `@arikajs/events`)
- **Event Bus**: When a task is moved to "Done", fire a `TaskCompletedEvent`.
- **Listeners & Mail**: A listener hears `TaskCompletedEvent` and uses the Mail system to send a congratulatory email to the project owner.

### 6. Caching & Storage (`@arikajs/cache`, `@arikajs/storage`)
- **Database Caching**: Cache the "Dashboard Layout" query (which loads boards and lists) using the Redis or Database driver to speed up load times.
- **File Uploads**: Allow users to attach images to tasks, saving them via the Storage system (local disk).

### 7. View Engine (`@arikajs/view`)
- **Templating**: Use `.ark.html` templates with layouts, components, and partials to render the frontend UI.

---

## 🚀 Implementation Steps

We will build FlowBoard iteratively.

### Phase 1: Foundation & Auth
- [ ] Scaffold `flowboard` using `arika new flowboard`
- [ ] Install the `api` and `web` auth templates (`arika auth:install web` & `api`)
- [ ] Configure sqlite connection.
- [ ] Verify Registration, Login, and Password Reset work perfectly.

### Phase 2: Core Models & Database
- [ ] Create Migrations & Models for `Board`, `List`, and `Task`.
- [ ] Define the Eloquent relationships between them.
- [ ] Create a `DatabaseSeeder` to populate test data.

### Phase 3: The API & Controllers
- [ ] Build `BoardController`, `ListController`, and `TaskController`.
- [ ] Implement strict `FormRequest` Validation (using `@arikajs/validation`) for creating tasks.
- [ ] Bind Authorization policies to the controllers.

### Phase 4: The View & Frontend Integration
- [ ] Build the dashboard UI using Blade-like ArikaJS templates and TailwindCSS.
- [ ] Implement the drag-and-drop board logic using simple Javascript that hits our API.

### Phase 5: The "Advanced" Polish
- [ ] Add the Mailer & Queue logic for task assignments.
- [ ] Add the Scheduler command for cleanup.
- [ ] Implement Caching for the board queries.

---

## 📋 Success Criteria
If we can build FlowBoard without encountering framework bugs, and the resulting code is clean, readable, and elegant—then ArikaJS is ready for a `v1.0.0` stable release. If we find friction points during this build, we fix them in the core framework before moving on.
