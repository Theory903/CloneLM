import { useEffect, useRef, useState } from 'react'
import PDFViewer from './components/PDFViewer'
import ChatInterface from './components/ChatInterface'
import FileUpload from './components/FileUpload'
import type { PDFDocument } from './types'

function App() {
  const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [viewerPage, setViewerPage] = useState<number | undefined>(undefined)
  const [leftWidthPct, setLeftWidthPct] = useState(50)
  const draggingRef = useRef(false)

  const handleDocumentProcessed = (document: PDFDocument) => {
    setCurrentDocument(document)
    setIsProcessing(false)
    setViewerPage(1)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      const container = document.getElementById('split-container')
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      let pct = (x / rect.width) * 100
      pct = Math.max(20, Math.min(80, pct))
      setLeftWidthPct(pct)
    }
    const onUp = () => {
      draggingRef.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      {!currentDocument ? (
        <div className="h-screen flex items-center justify-center">
          <div className="w-full max-w-2xl px-4">
            <FileUpload
              onDocumentProcessed={handleDocumentProcessed}
              setIsProcessing={setIsProcessing}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      ) : (
        <div className="h-screen flex relative" id="split-container">
          <div
            className="h-screen border-r border-gray-200 overflow-hidden relative"
            style={{ width: `${leftWidthPct}%` }}
          >
            <ChatInterface
              currentDocument={currentDocument}
              onCitationClick={(page) => setViewerPage(page)}
              onUploadNew={() => {
                setCurrentDocument(null)
                setViewerPage(undefined)
              }}
            />
          </div>
          <div
            className="absolute top-0 bottom-0 w-1 bg-gray-200 hover:bg-purple-400 cursor-col-resize transform -translate-x-0.5 hover:scale-x-[3] transition-all duration-150"
            style={{ left: `${leftWidthPct}%` }}
            onMouseDown={() => {
              draggingRef.current = true
            }}
            aria-label="Resize panels"
          />
          <div className="h-screen overflow-hidden" style={{ width: `${100 - leftWidthPct}%` }}>
            <PDFViewer document={currentDocument} goToPage={viewerPage} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
