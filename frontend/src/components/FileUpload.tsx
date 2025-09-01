import { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import type { PDFDocument, UploadResponse, ProcessResponse } from '../types'

interface FileUploadProps {
  onDocumentProcessed: (document: PDFDocument) => void
  setIsProcessing: (processing: boolean) => void
  isProcessing: boolean
}

const FileUpload: React.FC<FileUploadProps> = ({
  onDocumentProcessed,
  setIsProcessing,
  isProcessing
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadStatus('error')
      setErrorMessage('Please select a PDF file')
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setUploadStatus('error')
      setErrorMessage('File size must be less than 50MB')
      return
    }

    setUploadStatus('uploading')
    setErrorMessage('')

    try {
      // Upload file
      const formData = new FormData()
      formData.append('pdf', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const uploadData: UploadResponse = await uploadResponse.json()

      // Process PDF
      setIsProcessing(true)
      const processResponse = await fetch(`/api/process-pdf/${uploadData.file.filename}`, {
        method: 'POST'
      })

      if (!processResponse.ok) {
        throw new Error('Processing failed')
      }

      const processData: ProcessResponse = await processResponse.json()

      if (processData.success) {
        const processedDocument: PDFDocument = {
          ...uploadData.file,
          processed: true,
          chunks: processData.chunks
        }
        onDocumentProcessed(processedDocument)
        setUploadStatus('success')
      } else {
        throw new Error(processData.error || 'Processing failed')
      }

    } catch (error) {
      console.error('Upload/Process error:', error)
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
      setIsProcessing(false)
    }
  }

  const resetUpload = () => {
    setUploadStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {uploadStatus === 'idle' && (
          <label
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center gap-6 p-12 bg-white rounded-xl shadow-lg cursor-pointer transition-colors ${
              dragActive ? 'bg-purple-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Upload PDF to start chatting</h2>
              <p className="text-gray-500">Click or drag and drop your file here</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}

        {uploadStatus === 'uploading' && (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" className="text-blue-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Uploading and processing...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Document processed successfully!</p>
            <p className="text-sm text-gray-500 mb-4">
              Your document is ready for chatting. Switch to the Chat tab to start asking questions.
            </p>
            <button
              onClick={resetUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload Another Document
            </button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Upload failed</p>
            <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
            <button
              onClick={resetUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {isProcessing && uploadStatus !== 'uploading' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <div className="flex items-center">
              <LoadingSpinner size="sm" className="text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">Processing document...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileUpload
