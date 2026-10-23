-- SecureLand Migration: Create migration tracking table and core tables
-- This migration creates the secureland_migrations table and the five tables (users, secureland_documents, etc.)

-- Migration tracking table
CREATE TABLE IF NOT EXISTS secureland_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT 'system',
    checksum CHAR(64) COMMENT 'SHA-256 of migration file for integrity verification'
);

-- users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    INDEX (email)
);

-- secureland_documents table
CREATE TABLE IF NOT EXISTS secureland_documents (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID v4',
    user_id INT NULL,
    filename VARCHAR(255) NOT NULL COMMENT 'Original filename as shown to user',
    actual_filename VARCHAR(255) NOT NULL COMMENT 'Securely stored filename (UUID)',
    sha256_hash CHAR(64) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('pending', 'processing', 'processed', 'failed') DEFAULT 'pending',
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    integrity_status ENUM('MATCH', 'MISMATCH', 'NO_TRUSTED_REFERENCE', 'INVALID_REFERENCE', 'INACTIVE_REFERENCE', 'REFERENCE_ERROR') NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (user_id),
    INDEX (sha256_hash),
    INDEX (processing_status),
    INDEX (approval_status),
    INDEX (integrity_status)
);

-- secureland_trusted_references table
CREATE TABLE IF NOT EXISTS secureland_trusted_references (
    id VARCHAR(50) PRIMARY KEY COMMENT 'Reference ID like SL-REF-0001',
    name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL COMMENT 'Original filename',
    actual_filename VARCHAR(255) NOT NULL COMMENT 'Securely stored filename',
    sha256_hash CHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE COMMENT 'New references require explicit activation',
    is_validated BOOLEAN DEFAULT FALSE COMMENT 'Reference integrity verified by authorized user',
    is_demo BOOLEAN DEFAULT FALSE COMMENT 'Clearly marks demo/fictional references',
    registered_by INT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_by INT NULL,
    validated_at TIMESTAMP NULL,
    deactivated_by INT NULL,
    deactivated_at TIMESTAMP NULL,
    deactivation_reason TEXT NULL,
    FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (deactivated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (sha256_hash),
    INDEX (is_active),
    INDEX (is_validated),
    INDEX (is_demo)
);

-- secureland_verification_logs table
CREATE TABLE IF NOT EXISTS secureland_verification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id CHAR(36) NULL,
    reference_id VARCHAR(50) NULL,
    verification_status ENUM('MATCH', 'MISMATCH', 'NO_TRUSTED_REFERENCE', 'INVALID_REFERENCE', 'INACTIVE_REFERENCE', 'REFERENCE_ERROR') NOT NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by INT NULL,
    file_name VARCHAR(255) NULL,
    file_size INT NULL,
    FOREIGN KEY (document_id) REFERENCES secureland_documents(id) ON DELETE SET NULL,
    FOREIGN KEY (reference_id) REFERENCES secureland_trusted_references(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (verification_status),
    INDEX (verified_at),
    INDEX (document_id),
    INDEX (reference_id)
);

-- secureland_admin_audit_log table
CREATE TABLE IF NOT EXISTS secureland_admin_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NULL,
    target_id VARCHAR(100) NULL,
    action_details JSON NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (performed_at),
    INDEX (admin_user_id)
);
