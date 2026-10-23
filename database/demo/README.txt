SECURELAND DEMO REFERENCE PACK
==============================

Contents:
- reference_pdfs/Fictional_Property_Record_Certificate_Demo_Match.pdf: upload-ready fictional SL-REF-0001 match copy
- secureland_demo_seed.sql: MySQL/MariaDB table and seed rows with real SHA-256 hashes
- reference_manifest.csv: reference IDs, filenames, and SHA-256 hashes

The bundled PDF is the SL-REF-0001 demo file. The manifest also describes SL-REF-0002 and SL-REF-0003; their PDF files are not included in this public project folder.

Important:
1. These records are fictional and must not be represented as official land records.
2. The bundled SL-REF-0001 SHA-256 value was computed from the exact PDF bytes. Do not assume that other manifest entries have corresponding PDFs in this folder.
3. Keep the PDF files unchanged for MATCH tests. Editing/re-saving them changes their hashes.
4. The seed SQL creates a table named trusted_documents. If your existing schema uses different table/column names,
   adapt the SQL to your current schema rather than creating duplicate/conflicting tables.
5. Store PDFs in controlled server-side storage in your app; the file_name column is only a filename, not a full path.
6. A hash MATCH only establishes byte-for-byte equality with this demo file, not real-world authenticity.
7. For a mismatch test, duplicate one of the PDFs, change its contents, save as a different file, and verify it against
   the original reference ID. Expected result: MISMATCH.
8. Upload `reference_pdfs/Fictional_Property_Record_Certificate_Demo_Match.pdf` and compare it with SL-REF-0001
   for a successful demo match. It is byte-for-byte identical to the registered fictional reference PDF.
