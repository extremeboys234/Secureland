-- SecureLand demo trusted reference seed (MySQL/MariaDB)
-- For DEMO use only. These are fictional records, not official land records.
-- Run after selecting your secureland database. Back up your database first.

CREATE TABLE IF NOT EXISTS trusted_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reference_id VARCHAR(32) NOT NULL UNIQUE,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(80) NOT NULL DEFAULT 'Fictional Property Record',
  trusted_sha256 CHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  approval_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  source_note VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hashes below were computed from the exact PDF files included in this pack.
INSERT INTO trusted_documents
  (reference_id, document_name, document_type, trusted_sha256, file_name, approval_status, source_note)
VALUES
  ('SL-REF-0001', 'DEMO PROPERTY RECORD', 'Fictional Property Record', '70a8cf139d840de0a1c474799f785640a6fd4a79941286e25b30adbf4d7e1d2e', 'SL-REF-0001_Demo_Property_Record.pdf', 'APPROVED', 'Preloaded fictional SecureLand demo reference'),
  ('SL-REF-0002', 'DEMO PROPERTY RECORD', 'Fictional Property Record', '2cf66ce319ccbf6c3e16f79d79811ee79c303ef2aeaa201936688cc3f8f486b0', 'SL-REF-0002_Demo_Property_Record.pdf', 'APPROVED', 'Preloaded fictional SecureLand demo reference'),
  ('SL-REF-0003', 'DEMO PROPERTY RECORD', 'Fictional Property Record', '6e1341c59125f3619ab93cc8419229544d97f1a82eae00be90bda633bf9e7bc0', 'SL-REF-0003_Demo_Property_Record.pdf', 'APPROVED', 'Preloaded fictional SecureLand demo reference')
ON DUPLICATE KEY UPDATE
  document_name = VALUES(document_name),
  trusted_sha256 = VALUES(trusted_sha256),
  file_name = VALUES(file_name),
  approval_status = VALUES(approval_status),
  source_note = VALUES(source_note);