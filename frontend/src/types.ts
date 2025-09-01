export interface PDFDocument {
  filename: string;
  originalName: string;
  size: number;
  uploadTime: string;
  path: string;
  processed?: boolean;
  chunks?: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

export interface Citation {
  page: number;
  text: string;
  chunkId: number;
}

export interface ChatResponse {
  success: boolean;
  answer?: string;
  citations?: Citation[];
  sourcesCount?: number;
  error?: string;
}

export interface UploadResponse {
  message: string;
  file: PDFDocument;
}

export interface ProcessResponse {
  success: boolean;
  chunks?: number;
  filename?: string;
  error?: string;
}
