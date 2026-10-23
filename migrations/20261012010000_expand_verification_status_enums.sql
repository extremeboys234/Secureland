ALTER TABLE secureland_documents
    MODIFY COLUMN integrity_status ENUM(
        'MATCH',
        'MISMATCH',
        'NO_TRUSTED_REFERENCE',
        'INVALID_REFERENCE',
        'INACTIVE_REFERENCE',
        'REFERENCE_ERROR',
        'REFERENCE_UNAVAILABLE',
        'DOCUMENT_UNAVAILABLE',
        'ERROR'
    ) NULL;

ALTER TABLE secureland_verification_logs
    MODIFY COLUMN verification_status ENUM(
        'MATCH',
        'MISMATCH',
        'NO_TRUSTED_REFERENCE',
        'INVALID_REFERENCE',
        'INACTIVE_REFERENCE',
        'REFERENCE_ERROR',
        'REFERENCE_UNAVAILABLE',
        'DOCUMENT_UNAVAILABLE',
        'ERROR'
    ) NOT NULL;
