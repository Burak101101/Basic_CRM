'use client';

import { useState, useRef } from 'react';
import { PaperClipIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // MB cinsinden
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

interface AttachmentFile {
  id?: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

export default function FileUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 10, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];
    let errorMessage = '';

    // Dosya sayısı kontrolü
    if (files.length + newFiles.length > maxFiles) {
      errorMessage = `En fazla ${maxFiles} dosya yükleyebilirsiniz.`;
      setError(errorMessage);
      return;
    }

    // Her dosyayı kontrol et
    for (const file of newFiles) {
      // Dosya boyutu kontrolü
      if (file.size > maxFileSize * 1024 * 1024) {
        errorMessage = `${file.name} dosyası çok büyük. Maksimum ${maxFileSize}MB olmalıdır.`;
        break;
      }

      // Dosya tipi kontrolü
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''));
        }
        return file.type === type || file.name.toLowerCase().endsWith(type);
      });

      if (!isValidType) {
        errorMessage = `${file.name} dosya tipi desteklenmiyor.`;
        break;
      }

      validFiles.push(file);
    }

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    setError(null);
    onFilesChange([...files, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type === 'application/pdf') {
      return '📄';
    } else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      return '📝';
    } else if (file.type.includes('excel') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
      return '📊';
    } else {
      return '📎';
    }
  };

  return (
    <div className={`file-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-gray-50'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            Dosyaları buraya sürükleyin veya{' '}
            <span className="text-indigo-600 font-medium">seçmek için tıklayın</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Maksimum {maxFiles} dosya, her biri en fazla {maxFileSize}MB
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Seçili Dosyalar:</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getFileIcon(file)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Mevcut ekleri göstermek için bileşen
export function AttachmentList({ 
  attachments, 
  onRemove,
  readOnly = false 
}: { 
  attachments: AttachmentFile[];
  onRemove?: (index: number) => void;
  readOnly?: boolean;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-900">Ekler:</h4>
      {attachments.map((attachment, index) => (
        <div
          key={attachment.id || index}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <DocumentIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
              <p className="text-xs text-gray-500">
                {attachment.size ? formatFileSize(attachment.size) : 'Bilinmeyen boyut'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {attachment.url && (
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                İndir
              </a>
            )}
            {!readOnly && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-red-500 hover:text-red-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
