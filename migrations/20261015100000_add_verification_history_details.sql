ALTER TABLE secureland_verification_logs
    ADD COLUMN calculated_sha256 CHAR(64) NULL,
    ADD COLUMN expected_sha256 CHAR(64) NULL,
    ADD COLUMN signature_status VARCHAR(40) NULL,
    ADD COLUMN reason_code VARCHAR(40) NULL;
