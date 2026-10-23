ALTER TABLE secureland_documents
  ADD COLUMN document_number VARCHAR(100) NULL AFTER filename,
  ADD COLUMN property_id VARCHAR(100) NULL AFTER document_number,
  ADD COLUMN owner_name VARCHAR(255) NULL AFTER property_id,
  ADD COLUMN issuing_authority VARCHAR(255) NULL AFTER owner_name,
  ADD COLUMN issue_date DATE NULL AFTER issuing_authority,
  ADD COLUMN description TEXT NULL AFTER issue_date,
  ADD COLUMN reviewed_by INT NULL AFTER integrity_status,
  ADD COLUMN reviewed_at TIMESTAMP NULL DEFAULT NULL AFTER reviewed_by,
  ADD COLUMN review_note TEXT NULL AFTER reviewed_at,
  ADD KEY idx_documents_review_queue (approval_status, upload_date),
  ADD KEY idx_documents_reviewed_by (reviewed_by),
  ADD CONSTRAINT fk_documents_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
