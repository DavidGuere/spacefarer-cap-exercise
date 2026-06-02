# Galactic Spacefarer Adventure

A SAP CAP + Fiori Elements V4 learning exercise. Manages "Galactic Spacefarers" as StarCraft-style hero commanders assigned to races, ships, origin planets, departments, and positions. Demonstrates per-origin-planet data isolation, validation/enhancement event handlers, and decoupled Ethereal email notifications.

## Quick Start

```bash
npm install
npx cds deploy --to sqlite:db.sqlite
npm run watch
# Open http://localhost:4004/demo-login
```

## Demo Accounts

| User  | Password | Role  | Planet | Read         | Write        |
|-------|----------|-------|--------|--------------|--------------|
| terran-admin | admin | admin | Earth | Earth rows only | Earth rows only |
| zerg-admin   | admin | admin | Zerg Planet | Zerg rows only | Zerg rows only |
| protos-admin | admin | admin | Protos Planet | Protos rows only | Protos rows only |
| terran-user  | user  | —     | Earth | Earth rows only | None (403) |
| zerg-user    | user  | —     | Zerg Planet | Zerg rows only | None (403) |
| protos-user  | user  | —     | Protos Planet | Protos rows only | None (403) |

For the browser demo, open `/demo-login` and choose an admin or read-only user. The demo login page sets a local `demo_user` cookie so you can switch users without fighting browser Basic Auth caching.

## Domain Model

The main CRUD entity remains `Spacefarers`, as required by the assignment. Each spacefarer is a hero commander with:

- a race (`Terran`, `Zerg`, `Protoss`)
- an origin planet used for authorization isolation
- a starship with class, hull hardening, and capacity
- a command department and position
- stardust collected, wormhole skill, and suit color

On creation/activation, the handler validates stardust, grants a starter stardust bonus when needed, promotes wormhole skill from stardust thresholds, records `enlistedAt`, and emits a notification event.

## Draft Create Flow

`Spacefarers` is draft-enabled for the Fiori Elements create flow. For raw HTTP clients:

1. **POST** `/galaxy/Spacefarers` with spacefarer data to create a draft.
2. **POST** `/galaxy/Spacefarers(ID=<uuid>,IsActiveEntity=false)/GalaxyService.draftActivate` to validate, persist, and emit the notification event.

**Important:** The role check (`admin`) runs when the draft is created. The planet guard runs during activation, so an admin can only persist spacefarers for their own planet.

## Ethereal Mail

When a spacefarer is activated, the notification consumer logs a preview URL to the console:

```
[notification] - Mail preview: https://ethereal.email/message/...
```

Open that URL in a browser to see the rendered welcome email. The Ethereal test account is created lazily on first event and cached for the session.

## Production Path

This exercise uses mocked auth, SQLite, and in-process messaging. For production:

| Component  | Dev (this repo)  | Production           |
|------------|------------------|----------------------|
| Auth       | `mocked`         | `xsuaa`              |
| Database   | SQLite           | HANA                 |
| Messaging  | `local-messaging`| `enterprise-messaging` |

**Critical:** For `$user.planet` to resolve under XSUAA, `xs-security.json` must declare the attribute:

```json
{
  "attributes": [
    { "name": "planet", "valueType": "string" }
  ]
}
```

Without this, `$user.planet` resolves null and the isolation where-clause silently matches zero rows — every authenticated user sees an empty list.

## Testing

```bash
npm test
```

Three test layers:
- **`test/handlers.test.js`** — Layer 1: in-process `srv.create()` unit tests for `@Before` business logic (bypasses HTTP auth)
- **`test/auth.test.js`** — Layer 2: HTTP tests with explicit auth headers for authorization + planet isolation
- **`test/events.test.js`** — Layer 3: event emission test with 2-second timeout guard

`cds.test` starts a local CAP test server using this project's SQLite configuration. If you hit a `db.sqlite` lock, stop `cds watch` and rerun the tests.

## Pinned Versions

| Package                  | Version |
|--------------------------|---------|
| `@sap/cds`               | ^8      |
| `@sap/cds-dk`            | ^8      |
| `@cap-js/sqlite`         | ^1      |
| `nodemailer`             | ^6      |

## Implementation Notes

- Tests use `jest --runInBand` to avoid server-startup port contention.
- In-process handler tests wrap calls in `cds.tx({ user: new cds.User({ roles: ['admin'], attr: { planet: 'EARTH' } }) }, ...)` to bypass auth for unit-testing handler logic.
- `Planets` value help is restricted by `$user.planet`, so admins can only select their own origin planet.
- Fiori scaffold was hand-rolled (not via generator) — manifest.json at `app/spacefarers/webapp/manifest.json` was written by hand; if the UI doesn't load, regenerate via `npx -p @sap/generator-fiori yo @sap/fiori` in an interactive shell.
- `Spacefarers` are isolated by `origin.code = $user.planet`.
- The `@Before('CREATE')` handler auto-fills `origin_code` from `req.user.attr.planet` when missing and rejects cross-planet activation.
