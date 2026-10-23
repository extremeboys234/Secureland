# SecureLand Project Requirements and Library Inventory

This document lists the direct frontend packages declared in `package.json`. The project uses npm; this is not a Python `requirements.txt` file. `package.json` and `package-lock.json` remain the installation source of truth.

## Software and runtime requirements

- Node.js with npm, for installing frontend packages and running Vite, TypeScript, and lint scripts.
- PHP 8 or later, for the backend endpoints.
- PHP PDO and the PDO MySQL driver (`pdo_mysql`), for database access.
- MySQL or MariaDB, for persistent application data.
- A web server capable of serving the PHP endpoints and the built frontend.

Database settings must be supplied through the server environment using `SECURELAND_DB_DSN`, `SECURELAND_DB_USER`, and `SECURELAND_DB_PASSWORD`. For local development, copy `.env.example` to an ignored `.env` file and export its values into the PHP server process as described in `README.md`. Do not commit real credentials.

## Direct application dependencies

| Package | Manifest range | Purpose |
|---|---:|---|
| `@headlessui/react` | `^2.2.10` | Accessible, unstyled React UI components. |
| `lucide-react` | `^1.46.0` | Icon components used by the interface. |
| `react` | `^19.2.8` | Frontend component framework. |
| `react-dom` | `^19.2.8` | Renders React into the browser DOM. |
| `react-router-dom` | `^7.18.4` | Client-side application routing. |

## Direct development dependencies

| Package | Manifest range | Purpose |
|---|---:|---|
| `@tailwindcss/vite` | `^4.3.3` | Integrates Tailwind CSS with Vite. |
| `@types/node` | `^24.13.3` | TypeScript definitions for Node.js APIs used by tooling. |
| `@types/react` | `^19.2.18` | TypeScript definitions for React. |
| `@types/react-dom` | `^19.2.7` | TypeScript definitions for React DOM. |
| `@vitejs/plugin-react` | `^6.1.1` | React support for Vite development and builds. |
| `autoprefixer` | `^10.6.1` | Adds vendor prefixes to CSS where needed. |
| `oxlint` | `^1.81.0` | JavaScript/TypeScript linting. |
| `postcss` | `^8.5.28` | CSS transformation tooling. |
| `tailwindcss` | `^4.3.3` | Utility-first CSS framework. |
| `typescript` | `~6.0.2` | Static type checking and JavaScript compilation. |
| `vite` | `^8.3.0` | Frontend development server and production bundler. |

## Backend libraries and database driver

- No third-party PHP Composer packages are declared in the project.
- PHP's built-in **PDO** API is used for database access.
- PHP's **PDO MySQL** extension (`pdo_mysql`) connects PDO to MySQL/MariaDB.
- Other backend functions use PHP's native session, password verification, file upload, filesystem, JSON, and SHA-256 hashing APIs.

## Installation and project commands

Run from the project directory:

```sh
npm install
npm run dev
```

Available checks:

```sh
npx tsc --noEmit
npm run lint
npm run build
```

The exact resolved dependency tree is recorded in `package-lock.json`. This inventory lists direct dependencies only; transitive packages are managed by npm and should not be installed individually.
