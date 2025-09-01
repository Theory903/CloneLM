const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { ConversationalRetrievalQAChain } = require('langchain/chains');
const fs = require('fs');
const path = require('path');

class AIProcessor {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-pro',
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.1,
      maxOutputTokens: 1024
    });

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      model: 'embedding-001',
      apiKey: process.env.GOOGLE_API_KEY
    });

    this.vectorStores = new Map(); // Store vector stores per document
  }

  async processPDF(filePath, filename) {
    try {
      console.log(`Processing PDF: ${filename}`);

      // Load PDF
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();

      // Split text into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ['\n\n', '\n', ' ', '']
      });

      const chunks = await textSplitter.splitDocuments(docs);

      // Add metadata for page references
      chunks.forEach((chunk, index) => {
        chunk.metadata = {
          ...chunk.metadata,
          chunkId: index,
          filename: filename
        };
      });

      // Create vector store
      const vectorStore = await MemoryVectorStore.fromDocuments(
        chunks,
        this.embeddings
      );

      // Store vector store reference
      this.vectorStores.set(filename, vectorStore);

      console.log(`Processed ${chunks.length} chunks from ${filename}`);
      return {
        success: true,
        chunks: chunks.length,
        filename: filename
      };

    } catch (error) {
      console.error('Error processing PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async askQuestion(filename, question) {
    try {
      const vectorStore = this.vectorStores.get(filename);

      if (!vectorStore) {
        return {
          success: false,
          error: 'Document not found. Please upload and process the PDF first.'
        };
      }

      // Create retrieval chain
      const chain = ConversationalRetrievalQAChain.fromLLM(
        this.llm,
        vectorStore.asRetriever({
          k: 5, // Retrieve top 5 relevant chunks
          searchType: 'similarity'
        }),
        {
          returnSourceDocuments: true,
          verbose: false
        }
      );

      // Get answer with sources
      const response = await chain.call({
        question: question,
        chat_history: []
      });

      // Extract page references from source documents
      const citations = response.sourceDocuments.map((doc, index) => ({
        page: doc.metadata.page || 1,
        text: doc.pageContent.substring(0, 200) + '...',
        chunkId: doc.metadata.chunkId
      }));

      return {
        success: true,
        answer: response.text,
        citations: citations,
        sourcesCount: response.sourceDocuments.length
      };

    } catch (error) {
      console.error('Error answering question:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDocumentSummary(filename) {
    try {
      const vectorStore = this.vectorStores.get(filename);

      if (!vectorStore) {
        return {
          success: false,
          error: 'Document not found.'
        };
      }

      // Get all documents from vector store
      const retriever = vectorStore.asRetriever({ k: 10 });
      const docs = await retriever.getRelevantDocuments('document summary overview');

      const combinedText = docs.map(doc => doc.pageContent).join('\n\n');

      const summaryPrompt = `
        Please provide a concise summary of the following document content.
        Focus on the main topics, key points, and overall structure.
        Keep the summary under 300 words.

        Document content:
        ${combinedText}
      `;

      const response = await this.llm.invoke([
        { role: 'user', content: summaryPrompt }
      ]);

      return {
        success: true,
        summary: response.content || response.text || 'Summary generated'
      };

    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clean up vector store for a document
  removeDocument(filename) {
    this.vectorStores.delete(filename);
    console.log(`Removed vector store for ${filename}`);
  }

  // Get list of processed documents
  getProcessedDocuments() {
    return Array.from(this.vectorStores.keys());
  }
}

module.exports = new AIProcessor();
