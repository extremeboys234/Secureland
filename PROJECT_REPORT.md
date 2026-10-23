# SecureLand Project Report

## Title

**SecureLand: Property Document Management, Integrity Verification, and Administrative Review**

## Project Information

| Item | Details |
|---|---|
| Student name | [Enter student name] |
| Register number | [Enter register number] |
| Institution | [Enter institution] |
| Department | [Enter department] |
| Programme / semester | [Enter programme and semester] |
| Project guide | [Enter guide name] |
| Academic year | [Enter academic year] |

## Abstract

SecureLand is a web application for submitting and managing property-related documents. Authenticated users can upload supported files and view their document records and review status. Administrators can manage trusted reference documents, compare uploaded files with active references using server-side SHA-256 hashes, and approve or reject submissions. Verification attempts and administrative decisions are recorded for later review.

The system keeps document approval separate from file-integrity results. A hash match means that two files have the same bytes; it does not prove property ownership, legal validity, or the authenticity of an issuing authority. Documents are stored outside the public web directory and retrieved through authenticated server endpoints.

## 1. Introduction

Property documents are important records, and a digital document workflow needs to protect access while making review status clear to users and administrators. SecureLand provides a centralized interface for document submission, controlled review, and comparison against registered reference files.

The application is implemented as a React and TypeScript frontend with a PHP backend and a MySQL-compatible relational database. The frontend calls PHP JSON endpoints. The server handles authentication, authorization, file validation, storage, database operations, and hash calculation.

## 2. Problem Statement

Managing uploaded documents without a consistent workflow can make it difficult to track who submitted a file, whether it is awaiting review, and whether its bytes match a known reference. SecureLand addresses these workflow and integrity-checking needs while retaining separate statuses for administrator approval and technical hash comparison.

## 3. Objectives

- Provide authenticated user and administrator access.
- Accept supported property-document uploads and store them outside the public web directory.
- Maintain document metadata, ownership, upload dates, and review status.
- Calculate SHA-256 fingerprints on the server and compare documents with active trusted references.
- Keep integrity-check results separate from administrator approval decisions.
- Allow administrators to review, approve, or reject pending submissions, with a reason required for rejection.
- Preserve verification history and administrative audit records.
- Apply session authentication, role checks, CSRF protection, ownership checks, and prepared SQL statements.

## 4. Scope and Features

### 4.1 User features

- Log in and maintain an authenticated session.
- Upload PDF, JPEG, or PNG documents (the upload interface enforces a 10 MB maximum).
- Provide document and property metadata, such as document number, property ID, owner, issuing authority, issue date, and description.
- View owned documents and details, upload dates, approval status, and available verification information.
- Access verification history subject to ownership or administrator authorization.
- See a rejection reason for a rejected document through the user-facing document workflow.

### 4.2 Administrator features

- View database-backed dashboard statistics.
- Review documents in the pending-verification queue.
- Open or download documents through authorized endpoints.
- Compare an uploaded document with an active trusted reference.
- Register and manage trusted references and activate or deactivate them through protected endpoints.
- Approve or reject pending documents. A rejection requires a reason; reviewer identity and review time are recorded.
- Review administrative audit and verification records.

### 4.3 Out of scope and limitations

- AES or other file-at-rest encryption is **not implemented** in this build. Protected storage and access controls are used, but these are not encryption.
- PDF digital-signature parsing and cryptographic signature validation are not implemented.
- A matching SHA-256 hash establishes byte-for-byte equality with the selected reference only. It does not establish legal ownership, document authenticity, or issuer identity.
- The application does not implement a blockchain or an immutable hash chain.
- The current database has no reliable issuer table for an issuer-count dashboard metric, so that metric is not presented.

## 5. System Architecture

SecureLand follows a client/server architecture:

1. **Frontend:** A single-page React application provides login, upload, document, dashboard, and administrator review screens.
2. **Backend:** PHP endpoints use sessions and JSON responses for authentication, document actions, trusted-reference management, review decisions, and statistics.
3. **Database:** MySQL-compatible tables store users, document metadata, trusted references, verification history, and administrative audit events.
4. **File storage:** Uploaded files and reference files are held in server-side storage outside the public web directory. The application stores generated filenames and metadata in the database and serves files through authorized endpoints.

The frontend development server uses Vite. In development, Vite proxies API requests to the PHP server.

## 6. Main Data Entities

| Entity | Purpose |
|---|---|
| `users` | Stores user identity, password hash, and role (`user` or `admin`). |
| `secureland_documents` | Stores document owner, filenames, SHA-256 hash, metadata, upload date, processing state, approval state, integrity state, and review metadata. |
| `secureland_trusted_references` | Stores registered reference metadata, SHA-256 hash, activation/validation state, and administrator tracking fields. |
| `secureland_verification_logs` | Stores verification result, selected reference, verifier, timestamp, and available hash snapshots/reason details. |
| `secureland_admin_audit_log` | Records administrative actions, including document-review decisions. |
| `secureland_migrations` | Tracks applied database migrations. |

### Status separation

- **Approval status:** `pending`, `approved`, or `rejected`; set by the administrator review workflow.
- **Integrity status:** Records the result of a technical comparison, such as `MATCH` or `MISMATCH`, or a reference/error condition.
- **Signature status:** Signature inspection is unavailable in this build and is not inferred from a hash result.

## 7. Typical Workflows

### 7.1 User upload

1. The user signs in.
2. The user selects a supported file and enters document metadata.
3. The server validates the request, checks the uploaded file, and stores it outside the public web directory.
4. The server calculates the file's SHA-256 hash and creates the document record for the authenticated user.
5. The document enters the pending approval workflow. Upload success and hash calculation do not approve the document.

### 7.2 Administrator review

1. An administrator opens the pending-document queue.
2. The administrator can inspect document metadata and access the file through authorized endpoints.
3. The administrator may compare the file with an active, validated trusted reference.
4. The server calculates and compares hashes and records the verification attempt; a missing reference or failed comparison is not treated as a match.
5. The administrator approves the document or rejects it with a reason. The review endpoint checks the session, administrator role, CSRF token, document ID, and pending status before persisting the decision and audit record.
6. The user's document view retrieves the current status from the backend.

## 8. Security and Data Integrity

- PHP sessions authenticate users; login regenerates the session identifier.
- Role-based checks protect administrator endpoints.
- CSRF tokens are checked on state-changing operations.
- Document details, downloads, and history are restricted to the owner or an authorized administrator.
- Uploaded content is validated by MIME type and size; stored filenames are generated rather than trusted from user input.
- Files are stored outside the public web root and accessed via protected endpoints.
- PDO prepared statements are used for database operations.
- Passwords are verified against stored password hashes, rather than compared as plaintext.
- SHA-256 is calculated server-side from file bytes. It is used for integrity comparison, not encryption.
- Approval, integrity, and digital-signature states are independent.

## 9. Technology Stack

The exact direct JavaScript/TypeScript package names and manifest version ranges are listed in [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md). The main technologies are:

- **Frontend:** React 19, TypeScript, React Router, Tailwind CSS, and Vite.
- **Backend:** PHP 8+ with native PHP session, file-upload, hashing, and PDO APIs.
- **Database:** MySQL/MariaDB through PDO MySQL.
- **Development checks:** TypeScript compiler and Oxlint.

No third-party PHP Composer packages are declared in this project; backend database access uses PHP's PDO API. MySQL/MariaDB, PHP, Node.js, and npm are runtime/development platforms rather than JavaScript libraries.

## 10. Testing and Verification

The repository includes [PHASE2_TEST_SUMMARY.md](./PHASE2_TEST_SUMMARY.md), which records tests for authentication and CSRF, upload validation, SHA-256 calculation, user-scoped listing, document details, authorized downloads, and session persistence.

The repository also documents the current verification and signature-validation limitations in [README.md](./README.md). For a demonstration match, use the unchanged fictional reference PDF specified in [database/demo/README.txt](./database/demo/README.txt) and compare it with the corresponding active reference. Editing or re-saving the PDF changes its hash.

This report is documentation, not a new test run. Before a formal submission or demonstration, run the project checks from the repository root:

```sh
npx tsc --noEmit
npm run lint
npm run build
```

PHP endpoint syntax can be checked with `php -l path/to/file.php`.

## 11. Conclusion

SecureLand demonstrates a controlled property-document workflow with authenticated uploads, ownership-aware access, administrator review, trusted-reference management, and server-side SHA-256 comparison. It keeps technical file equality separate from approval and legal claims. The current build does not provide AES encryption at rest or PDF digital-signature validation; these should be described as future enhancements, not completed features.

## References

- React documentation: https://react.dev/
- TypeScript documentation: https://www.typescriptlang.org/docs/
- PHP documentation: https://www.php.net/docs.php
- MySQL documentation: https://dev.mysql.com/doc/
- Vite documentation: https://vite.dev/guide/
