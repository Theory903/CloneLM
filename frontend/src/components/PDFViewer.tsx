import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'
import type { PDFDocument } from '../types'

interface PDFViewerProps {
  document: PDFDocument
  goToPage?: number
}

const PDFViewer: React.FC<PDFViewerProps> = ({ document, goToPage }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)

  // Debug logging
  console.log('PDFViewer rendered with document:', document)

  useEffect(() => {
    // If parent requests a page jump, clamp and set
    if (goToPage && totalPages > 0) {
      const clamped = Math.max(1, Math.min(goToPage, totalPages))
      setCurrentPage(clamped)
    }
  }, [goToPage, totalPages])

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.25))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25))
  }

  const handleDownload = () => {
    // For now, show a message that download is not implemented
    alert('Download functionality will be implemented when file serving is set up on the backend.')
  }

  useEffect(() => {
    // reset when document changes
    setCurrentPage(1)
    setTotalPages(0)
  }, [document])

  // Safety check for document
  if (!document) {
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No document selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">{document.originalName}</h3>
            <span className="text-sm text-gray-500">
              {currentPage} of {totalPages}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page)
                }
              }}
              className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">of {totalPages}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* PDF Display Area */}
      <div className="relative bg-gray-100 flex-1">
        <div className="flex items-center justify-center h-full p-2">
          <div
            className="bg-white shadow-lg border overflow-auto flex items-center justify-center"
            style={{
              height: '100%',
              width: '100%'
            }}
          >
            {/* For now, show a placeholder since we need to implement file serving */}
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Document Ready</h3>
              <p className="text-gray-600 mb-4">
                Document: <strong>{document.originalName}</strong>
              </p>
              <p className="text-sm text-gray-500">
                PDF viewing will be available once file serving is implemented on the backend.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You can still chat with the AI about this document's content!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PDFViewer
