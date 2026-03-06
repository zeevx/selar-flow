# Selar Flow

A visual marketing automation workflow builder for the Selar platform. Build email sequences and logic-based flows that trigger automatically on product purchases or abandoned carts — using a drag-and-drop node editor.

## What It Does

- **Visual flow builder** — drag, connect, and configure nodes on an infinite canvas
- **Trigger-based execution** — flows fire on `purchased` or `abandoned` purchase events
- **Node types**: Start, Action (Delay, Send Email), Condition, End
- **Variable interpolation** — use `{{email}}`, `{{customer_name}}`, `{{product_name}}`, `{{quantity}}`, `{{total_price}}` in email bodies
- **Draft / Live modes** — flows are auto-saved in draft; toggling to Live publishes the flow
- **Durable workflow execution** — delays and multi-step sequences survive server restarts via Laravel Workflow

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | PHP 8.2+, Laravel 12                   |
| Frontend  | Vue 3, TypeScript, Inertia.js, Tailwind CSS v4 |
| Canvas    | Vue Flow                                |
| Workflows | laravel-workflow (durable queue-based)  |
| Testing   | Pest PHP                                |
| Database  | SQLite (dev), any Laravel-supported DB  |

---

## Requirements

- PHP 8.2+
- Composer
- Node.js 18+ and npm
- A queue worker (SQLite-backed jobs by default)

---

## Installation

```bash
git clone <repo-url> selarflow
cd selarflow
composer setup
```

The `composer setup` script handles everything:

1. `composer install`
2. Copies `.env.example` to `.env`
3. Generates the app key
4. Runs migrations
5. `npm install`
6. `npm run build`

---

## Running Locally

```bash
composer dev
```

This starts four concurrent processes:

| Process | Description                         |
|---------|-------------------------------------|
| `server` | `php artisan serve` (HTTP server)  |
| `queue`  | `php artisan queue:listen`          |
| `logs`   | `php artisan pail` (log viewer)     |
| `vite`   | `npm run dev` (frontend HMR)        |

Open `http://localhost:8000` to see the app.

> The queue worker is required for workflow execution (delays, email sending).

---

## Environment

Copy `.env.example` to `.env` and configure:

```env
# Mail (for SendEmailActivity)
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=noreply@example.com

# Queue (default: sync won't work for durable workflows — use database or redis)
QUEUE_CONNECTION=database
```

---

## Code Structure

```
app/
  Console/
    Commands/
      TestFlowExecution.php   # Artisan command: php artisan flow:test
  Http/
    Controllers/
      FlowController.php      # POST /flow — create or update a flow
  Models/
    Flow.php                  # Flow model (nodes/edges stored as JSON)
    Product.php               # Product model
    Purchase.php              # Purchase model
  Workflows/
    FlowExecutorWorkflow.php  # Durable workflow: traverses and executes flow nodes
    Activities/
      SendEmailActivity.php   # Sends email via Laravel Mail

resources/js/
  pages/
    Welcome.vue               # Main page — the flow builder UI
  components/
    node/
      Start.vue               # Start node component
      End.vue                 # End node component
      Action.vue              # Action node (delay / send_email)
      Condition.vue           # Condition node (branching logic)
      flow/
        CustomActionButton.vue      # Edge button for adding nodes
        CustomConnectionLine.vue    # Custom connection line renderer
  composables/
    useFlowInit.ts            # Initialize nodes/edges from saved flow or defaults
    useFlowPersistence.ts     # Auto-save, draft/live status toggle
    useFlowConnection.ts      # Handle connecting nodes on the canvas
    useAddNode.ts             # Add a new node to the flow

routes/
  web.php                     # GET / (flow builder), POST /flow (save flow)

tests/
  Feature/
    FlowManagementTest.php    # Feature tests for flow CRUD and validation
```

---

## Database Schema

### `flows`

| Column       | Type    | Notes                                      |
|--------------|---------|--------------------------------------------|
| `id`         | integer | Primary key                                |
| `name`       | string  | Flow name (defaults to "Untitled Flow")    |
| `product_id` | integer | FK to `products` — required when `status=live` |
| `trigger`    | string  | `purchased` or `abandoned` — required when `status=live` |
| `nodes`      | JSON    | Array of Vue Flow node objects             |
| `edges`      | JSON    | Array of Vue Flow edge objects             |
| `status`     | string  | `draft` or `live`                          |

### `products`

| Column        | Type    |
|---------------|---------|
| `id`          | integer |
| `name`        | string  |
| `description` | string  |
| `price`       | decimal |

### `purchases`

| Column       | Type    |
|--------------|---------|
| `id`         | integer |
| `product_id` | integer |
| `email`      | string  |
| `unit_price` | decimal |
| `quantity`   | integer |
| `total_price`| decimal |
| `status`     | string  |

---

## Flow Node Types

### Start
Entry point of every flow. Displays the product and trigger assigned to the flow.

### Action
Executes a step in the sequence. Two action types:

- **Delay** — pauses the workflow for a configurable duration (minutes, hours, days). Uses a durable timer; survives server restarts.
- **Send Email** — sends an email to the purchase contact. Supports variable interpolation:
  - `{{email}}`
  - `{{customer_name}}`
  - `{{product_name}}`
  - `{{quantity}}`
  - `{{total_price}}`

### Condition
Branches the flow based on a purchase property. Evaluates to true (right branch) or false (left branch).

Supported properties: `purchase_email`, `purchase_quantity`, `purchase_total_price`

Supported operators: `equals`, `not_equals`, `contains`, `greater_than`, `less_than`, `greater_or_equal`, `less_or_equal`

### End
Terminates the flow path.

---

## Workflow Execution

When a flow is triggered (e.g., on purchase), `FlowExecutorWorkflow` is dispatched:

1. Loads the flow from the database — skips if not `live`
2. Finds the `start` node
3. Traverses nodes sequentially, following edges
4. For `action` nodes: executes delay timers or dispatches `SendEmailActivity`
5. For `condition` nodes: evaluates the condition and follows the appropriate branch
6. Cycle detection and a 1000-node visit cap prevent infinite loops

Workflows are durable — a delay of "2 hours" actually pauses execution for 2 hours, not just `sleep(7200)`.

---

## API

### `POST /flow`

Creates or updates a flow.

**Request body:**

```json
{
  "id": 1,                        // optional — omit to create new
  "name": "Welcome Flow",
  "product_id": 5,                // required if status=live
  "trigger": "purchased",         // "purchased" | "abandoned" — required if status=live
  "nodes": [...],                 // Vue Flow node array
  "edges": [...],                 // Vue Flow edge array
  "status": "draft"               // "draft" | "live"
}
```

**Response:** 302 redirect back, with flash `savedFlowId` containing the flow ID.

---

## Testing

```bash
composer test
```

This runs:
1. Config cache clear
2. PHP lint check (`pint --parallel --test`)
3. Pest test suite

To run just the tests:

```bash
php artisan test
```

To run linting:

```bash
composer lint
```

### Testing Flow Execution

Trigger a manual workflow test against all flows in the database:

```bash
php artisan flow:test
```

This simulates a purchase event with a test context (`test@example.com`, quantity 1, total $99.99) and queues the workflow for every flow in the database.

---

## Frontend Scripts

```bash
npm run dev          # Vite dev server with HMR
npm run build        # Production build
npm run build:ssr    # SSR build
npm run lint         # ESLint auto-fix
npm run format       # Prettier format
npm run format:check # Prettier check
```