import React, { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  onDragOver?: () => void;
  onDragLeave?: () => void;
}

const DEFAULT_ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeMB = 10,
  onDragOver,
  onDragLeave
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (onDragOver) onDragOver();
  }, [onDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (onDragLeave) onDragLeave();
  }, [onDragLeave]);

  const handleFileSelection = useCallback((file: File) => {
    // Validate file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      setSelectedFileName(null);
      setError(`Unsupported file type. Please upload: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`);
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setSelectedFileName(null);
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setError(null);
    setSelectedFileName(file.name);
    onFileSelected(file);
  }, [acceptedTypes, maxSizeMB, onFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-12 text-center
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
        hover:border-blue-400 cursor-pointer transition-all`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose a document to upload"
      />
      <Upload className="h-10 w-10 mb-4 text-blue-500" />
      <p className="text-lg font-medium text-gray-800 mb-2">
        Drag & drop your document here
      </p>
      <p className="text-sm text-gray-600 mb-4">
        or browse files
      </p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Browse Files
      </button>
      {selectedFileName && (
        <p role="status" className="mt-4 text-sm font-medium text-green-700">
          Selected: {selectedFileName}
        </p>
      )}
      <p className="mt-4 text-xs text-gray-500">
        Supported formats: PDF, JPG, PNG
      </p>
      <p className="text-xs text-gray-500">
        Maximum file size: {maxSizeMB}MB
      </p>
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;