import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, FileText, ExternalLink, X } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import type { PDFDocument, ChatMessage, ChatResponse, Citation } from '../types'

interface ChatInterfaceProps {
  currentDocument: PDFDocument
  onUploadNew?: () => void
  onCitationClick?: (page: number) => void
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentDocument, onCitationClick, onUploadNew }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: currentDocument.filename,
          question: inputMessage.trim()
        })
      })

      const data: ChatResponse = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.success ? data.answer || 'No response generated' : data.error || 'An error occurred',
        timestamp: new Date(),
        citations: data.citations
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCitationClick = (citation: Citation) => {
    if (onCitationClick) {
      onCitationClick(citation.page)
    }
  }

  // Minimal markdown renderer (bold + paragraphs + bullet lists)
  const renderInline = (text: string) => {
    const segments = text.split(/(\*\*[^*]+\*\*)/g)
    return segments.map((seg, i) => {
      const m = seg.match(/^\*\*([^*]+)\*\*$/)
      if (m) {
        return (
          <strong key={i} className="font-semibold">{m[1]}</strong>
        )
      }
      return <span key={i}>{seg}</span>
    })
  }

  const renderMarkdown = (text: string) => {
    const paragraphs = text.split(/\n\s*\n/)
    return paragraphs.map((para, idx) => {
      const lines = para.split(/\n/)
      const isList = lines.every(l => l.trim().startsWith('- '))
      if (isList) {
        return (
          <ul key={idx} className="list-disc pl-5 space-y-1">
            {lines.map((l, li) => (
              <li key={li}>{renderInline(l.trim().replace(/^\-\s+/, ''))}</li>
            ))}
          </ul>
        )
      }
      return (
        <p key={idx} className="leading-relaxed">
          {renderInline(para)}
        </p>
      )
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chat with Document</h3>
              <p className="text-sm text-gray-500">{currentDocument.originalName}</p>
            </div>
          </div>
          {onUploadNew && (
            <button
              onClick={onUploadNew}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-50 transition-colors"
              title="Upload new PDF"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h4>
            <p className="text-gray-500">
              Ask questions about your document and get AI-powered answers with citations.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex space-x-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.type === 'assistant' ? (
                  <div className="text-sm space-y-2">{renderMarkdown(message.content)}</div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}

                {message.type === 'assistant' && message.citations && message.citations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Sources:</p>
                    <div className="space-y-1">
                      {message.citations.map((citation, index) => (
                        <button
                          key={index}
                          onClick={() => handleCitationClick(citation)}
                          className="flex items-start space-x-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors w-full text-left"
                        >
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">Page {citation.page}</span>
                            <p className="text-gray-600 truncate">{citation.text}</p>
                          </div>
                          <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.type === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex space-x-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" className="text-blue-600" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your document..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
