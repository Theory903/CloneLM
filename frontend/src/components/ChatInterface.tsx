import React, { useState, useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import { type ChatMessage, type Citation } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ChatInterfaceProps {
  currentDocument: string | null;
  onNavigateToPage?: (page: number) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentDocument, 
  onNavigateToPage 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant. Upload a PDF document and I\'ll help you understand it. You can ask me questions about the content, request summaries, or explore specific topics.',
      timestamp: new Date(),
      citations: []
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !currentDocument) return;

          const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: inputValue,
        timestamp: new Date(),
        citations: []
      };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ASK), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: currentDocument,
          question: inputValue
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          citations: data.citations || []
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error asking question:', error);
      
              const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          citations: []
        };

      setMessages(prev => [...prev, errorMessage]);
      setNetworkError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (citation: Citation) => {
    if (onNavigateToPage && citation.page) {
      onNavigateToPage(citation.page);
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Network Error Banner */}
      {networkError && (
        <div className="bg-red-50 p-4 flex items-center gap-2 border-b border-red-100">
          <span className="text-red-700">{networkError}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'assistant' && (
                  <Bot className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                )}
                {message.type === 'user' && (
                  <User className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(message.content)
                    }}
                  />
                  
                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.citations.map((citation, index) => (
                          <button
                            key={index}
                            onClick={() => handleCitationClick(citation)}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          >
                            Page {citation.page || citation.chunkId || index + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <LoadingSpinner />
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="p-4 border-t bg-white" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about the document..."
            disabled={!currentDocument || isLoading}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !currentDocument || isLoading}
            className="p-2 bg-purple-600 text-white rounded-lg transition-colors opacity-50 cursor-not-allowed disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
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
              className="lucide lucide-send w-5 h-5"
            >
              <path d="m22 2-7 20-4-9-9-4Z"></path>
              <path d="M22 2 11 13"></path>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
