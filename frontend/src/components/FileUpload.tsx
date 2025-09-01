import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import { type PDFDocument } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface FileUploadProps {
  onFileProcessed: (document: PDFDocument) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadStatus('Error: Only PDF files are allowed');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading PDF...');
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('pdf', file);

      // Upload file
      const uploadResponse = await fetch(buildApiUrl(API_ENDPOINTS.UPLOAD), {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json();
      setUploadProgress(50);
      setUploadStatus('Processing PDF...');

      // Process the uploaded PDF
      const processResponse = await fetch(
        buildApiUrl(`${API_ENDPOINTS.PROCESS_PDF}/${uploadResult.file.filename}`),
        { method: 'POST' }
      );

      if (!processResponse.ok) {
        throw new Error(`Processing failed: ${processResponse.statusText}`);
      }

      const processResult = await processResponse.json();
      setUploadProgress(100);
      setUploadStatus('PDF processed successfully!');

      // Create document object
      const pdfDocument: PDFDocument = {
        filename: uploadResult.file.filename,
        originalName: uploadResult.file.originalName,
        size: uploadResult.file.size,
        path: uploadResult.file.path,
        uploadTime: uploadResult.file.uploadTime,
        processed: processResult.success,
        chunks: processResult.chunks || 0,
      };

      onFileProcessed(pdfDocument);

      // Reset form
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Upload failed'}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            Upload your PDF document
          </p>
          <p className="text-sm text-gray-500">
            Drag and drop your PDF here, or click to browse
          </p>
        </div>

        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={isUploading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Choose File
        </button>

        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{uploadStatus}</p>
            <LoadingSpinner />
          </div>
        )}

        {uploadStatus && !isUploading && (
          <div className="mt-4">
            <p className={`text-sm ${
              uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>
              {uploadStatus}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
