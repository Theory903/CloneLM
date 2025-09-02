import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react'
import type { PDFDocument } from '../types'
import { Document as PDFDoc, Page, pdfjs } from 'react-pdf'
import { buildFileViewUrl, buildFileDownloadUrl } from '../config/api'
import LoadingSpinner from './LoadingSpinner'

// Configure pdf.js worker for Vite/ESM
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

interface PDFViewerProps {
  document: PDFDocument
  goToPage?: number
}

const PDFViewer: React.FC<PDFViewerProps> = ({ document, goToPage }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Build the correct file URL for viewing
  const fileUrl = useMemo(() => {
    return buildFileViewUrl(document.filename)
  }, [document.filename])

  // Build download URL
  const downloadUrl = useMemo(() => {
    return buildFileDownloadUrl(document.filename)
  }, [document.filename])

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

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    const a = window.document.createElement('a')
    a.href = downloadUrl
    a.download = document.originalName || document.filename
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  useEffect(() => {
    // reset when document changes
    setIsLoading(true)
    setCurrentPage(1)
    setTotalPages(0)
    setError(null)
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
              onClick={handleRotate}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Rotate"
            >
              <RotateCcw className="h-4 w-4" />
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
            {error ? (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading PDF</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <PDFDoc
                file={fileUrl}
                onLoadSuccess={({ numPages }) => {
                  setTotalPages(numPages)
                  setIsLoading(false)
                  setError(null)
                }}
                onLoadError={(error) => {
                  console.error('PDF load error:', error)
                  setIsLoading(false)
                  setError('Failed to load PDF. Please check if the file exists and try again.')
                }}
                loading={
                  <div className="text-center">
                    <LoadingSpinner size="lg" className="text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                }
                error={<p className="text-red-600 p-4">Failed to load PDF.</p>}
              >
                {!isLoading && (
                  <Page 
                    pageNumber={currentPage} 
                    scale={scale} 
                    rotate={rotation} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false} 
                  />
                )}
              </PDFDoc>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PDFViewer
