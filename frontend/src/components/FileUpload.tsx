import React, { useState, useCallback } from 'react';
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
      <label 
        className={`relative flex flex-col items-center gap-6 p-12 bg-white rounded-xl shadow-lg cursor-pointer hover:bg-gray-50 transition-colors ${
          isDragOver ? 'bg-purple-50 border-2 border-purple-300' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="lucide lucide-upload w-8 h-8 text-purple-600"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" x2="12" y1="3" y2="15"></line>
          </svg>
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isUploading ? 'Processing your PDF...' : 'Upload PDF to start chatting'}
          </h2>
          <p className="text-gray-500">
            {isUploading ? 'Please wait while we process your document' : 'Click or drag and drop your file here'}
          </p>
        </div>

        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading && (
          <div className="w-full space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 text-center">{uploadStatus}</p>
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          </div>
        )}

        {uploadStatus && !isUploading && (
          <div className="w-full">
            <p className={`text-sm text-center ${
              uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>
              {uploadStatus}
            </p>
          </div>
        )}
      </label>
    </div>
  );
};

export default FileUpload;
