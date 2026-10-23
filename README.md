# SecureLand

SecureLand is a web application for uploading, managing, and reviewing property-related documents. It combines a React/TypeScript single-page application with PHP JSON endpoints and a MySQL-compatible database.

> **Demo and security scope:** Trusted-reference PDFs supplied with the project are fictional. A SHA-256 match establishes byte-for-byte equality with a selected reference only; it does not establish property ownership, legal validity, or issuing-authority authenticity. AES encryption at rest and PDF digital-signature validation are not implemented.

## Project documents

- [Project Report (PDF)](./docs/project-report.pdf)
- [Project Requirements and Library Inventory (PDF)](./docs/project-requirements.pdf)
- [Project Report (Markdown)](./PROJECT_REPORT.md)
- [Project Requirements and Library Inventory (Markdown)](./PROJECT_REQUIREMENTS.md)

## Problem and objectives

Property-document submissions need a controlled way to store files, track their owner and review state, and compare a file with an explicitly trusted reference. SecureLand aims to:

- authenticate users and restrict administrative capabilities by role;
- accept and track document submissions and metadata;
- store uploaded files outside the public web directory;
- calculate SHA-256 hashes server-side and compare files with active references;
- keep integrity results separate from administrator approval decisions; and
- preserve verification history and administrative audit events.

## Features

### User workflow

- Session-based login and logout with CSRF protection.
- Upload PDF, JPEG, or PNG documents, up to 10 MB, with property/document metadata.
- View owned documents, details, upload dates, and current review status.
- Download documents through authenticated, ownership-checked endpoints.
- View verification history subject to ownership or administrator authorization.

### Administrator workflow

- Review pending documents and inspect their metadata.
- Compare a submitted file with an active, validated trusted reference.
- Register, inspect, activate, and deactivate trusted references.
- Approve or reject pending documents; rejection requires a reason.
- View database-backed dashboard statistics and administrative audit records.

Approval status, integrity status, and digital-signature status are independent. Uploading a file or calculating its hash does not approve it.

## Technology stack

- **Frontend:** React 19, TypeScript, React Router, Tailwind CSS, Vite.
- **Backend:** PHP 8+ using native sessions, file handling, hashing, and PDO APIs.
- **Database:** MySQL or MariaDB through PHP PDO MySQL (`pdo_mysql`).
- **Tooling:** npm, TypeScript, Oxlint.
- **Direct package inventory:** See [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md) or the [requirements PDF](./docs/project-requirements.pdf).

## Architecture and repository layout

```text
admin/                 Admin-only JSON endpoints
auth/                  Login, logout, session, and CSRF endpoints
database/demo/         Fictional demo manifest and seed/reference guidance
documents/             Upload, list, details, download, review, and verification APIs
docs/                  Required project PDFs
migrations/            Ordered additive SQL migrations
public/                Public static assets
references/            Trusted-reference API endpoints
src/                   React/TypeScript pages, components, and services
config/                Shared server-side configuration
dev-router.php         Allowlisted PHP built-in-server router
```

Uploaded documents are stored outside the project web root in the parent workspace's `storage/` directory by the current upload endpoint. Do not copy personal or test uploads into the repository.

## Prerequisites

- Node.js and npm versions supported by the Vite version in `package-lock.json`.
- PHP 8+ with `pdo_mysql`, fileinfo, and file-upload support enabled.
- MySQL or MariaDB.
- A shell for loading local environment variables.

## Installation and configuration

1. Install frontend dependencies:

   ```sh
   npm ci
   ```

2. Create a local environment file and set values for your own development database:

   ```sh
   cp .env.example .env
   ```

   Edit `.env` locally. It is ignored by Git. Do not put real credentials in `.env.example`, source files, screenshots, or commits. The PHP backend reads the `SECURELAND_DB_*` process environment variables; the frontend does not receive these backend values.

3. Provision the development database and a dedicated application account using your local MySQL/MariaDB administration tool. Grant the account the database privileges needed to apply the migrations; reduce privileges to runtime requirements after setup if your deployment supports that separation. Keep administrator credentials out of this project.

4. Apply the migrations in filename order. For example, after loading your application environment in the shell:

   ```sh
   for migration in migrations/*.sql; do
     mysql -u "$SECURELAND_DB_USER" -p --database=secureland_dev < "$migration"
   done
   ```

   MySQL prompts for the application database password; it is not placed in the command line. Review each migration and back up any existing database before applying schema changes.

5. Start the PHP API server from the project directory. The router allows only the application PHP endpoints and prevents the local `.env` file and other files from being served:

   ```sh
   set -a
   . ./.env
   set +a
   php -S 127.0.0.1:8341 -t . dev-router.php
   ```

6. In another terminal, start the frontend:

   ```sh
   npm run dev
   ```

   Open the local URL printed by Vite (the default project port is 5174). Vite proxies API calls to the PHP server on `127.0.0.1:8341`; adjust the local proxy configuration if you choose another backend port.

7. Create user and administrator accounts through the project's intended account-management workflow. Do not rely on or publish passwords from old development notes.

The demo SQL in `database/demo/secureland_demo_seed.sql` is reference material for fictional data and describes a separate seed schema. Do not apply it blindly to the application's migrated schema. Register trusted references using the protected application workflow or carefully adapt the demo data to the existing schema.

## Database migrations

Apply these files once, in lexicographic filename order:

1. `20261011231345_create_secureland_tables.sql`
2. `20261012010000_expand_verification_status_enums.sql`
3. `20261015100000_add_verification_history_details.sql`
4. `20261015213000_add_document_review_metadata.sql`

The migrations create or extend the user, document, trusted-reference, verification-log, and admin-audit tables. They do not reset or delete existing records. Back up existing databases and verify migration compatibility before applying to non-disposable data.

## Testing and checks

From the project directory:

```sh
npx tsc --noEmit
npm run lint
npm run build
```

Check PHP syntax for an endpoint with:

```sh
php -l documents/upload.php
```

The repository's [Phase 2 test summary](./PHASE2_TEST_SUMMARY.md) records prior local checks of authentication/CSRF, upload validation, protected storage, SHA-256 calculation, listing, document details, and downloads. It is a historical summary, not a claim that those checks were rerun for every change.

## Security notes

- Keep `.env`, cookie jars, logs, local database files, and uploaded records out of Git.
- Configure strong database credentials through environment variables and use a least-privilege database account.
- Deploy the PHP API behind a production web server configured to expose only the intended API and static assets; the included router is for local PHP built-in-server development.
- Maintain session security, CSRF checks, role authorization, ownership checks, and prepared SQL statements.
- Keep uploaded files outside the public web root and retain safe path resolution.
- SHA-256 is a one-way hash used for integrity comparison, not encryption.
- A hash match does not prove legal ownership or authenticity. PDF signature validation and at-rest AES encryption are not implemented.
- Demo property records are fictional and must not be presented as official land records.

## Known limitations and future improvements

- Add and test encryption at rest with a documented key-management and rotation design.
- Add PDF signature validation with a defined certificate trust policy and genuine signed test documents.
- Add automated backend/API integration tests and a reproducible test database setup.
- Add production deployment guidance, including web-server hardening, HTTPS, backups, and operational secret management.
- The current database does not provide a reliable issuer table, so issuer statistics are not shown.
