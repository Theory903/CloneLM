import { FileText, Clock, Trash2, CheckCircle } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import type { PDFDocument } from '../types'

interface DocumentListProps {
  documents: PDFDocument[]
  currentDocument: PDFDocument | null
  onDocumentSelect: (document: PDFDocument) => void
  isProcessing: boolean
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  currentDocument,
  onDocumentSelect,
  isProcessing
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async (document: PDFDocument) => {
    if (confirm(`Are you sure you want to delete "${document.originalName}"?`)) {
      try {
        const response = await fetch(`/document/${document.filename}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          // Refresh the page or update the documents list
          window.location.reload()
        }
      } catch (error) {
        console.error('Delete error:', error)
        alert('Failed to delete document')
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
        <p className="text-sm text-gray-500 mt-1">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No documents uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Upload a PDF to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((document) => (
              <div
                key={document.filename}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  currentDocument?.filename === document.filename ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
                onClick={() => onDocumentSelect(document)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {document.originalName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(document.size)}
                        </span>
                        {document.processed && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">Processed</span>
                          </div>
                        )}
                        {document.chunks && (
                          <span className="text-xs text-gray-500">
                            {document.chunks} chunks
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatDate(document.uploadTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(document)
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isProcessing && (
          <div className="p-4 border-t bg-blue-50">
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" className="text-blue-600" />
              <span className="text-sm text-blue-700">Processing document...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentList
