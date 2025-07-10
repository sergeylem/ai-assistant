// src/knowledge/knowledge.service.ts - Упрощенная версия
import { Injectable, Logger } from '@nestjs/common';
import { RagService } from '../rag/rag.service';
import { ChromaUtils } from '../rag/chroma';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private readonly ragService: RagService) {}

  async processFile(file: Express.Multer.File): Promise<void> {
    try {
      this.logger.log(`Processing file: ${file.originalname} (${file.mimetype})`);
      
      // Извлекаем текст из файла
      const text = await this.extractTextFromFile(file);
      
      if (!ChromaUtils.isValidText(text)) {
        throw new Error('File appears to be empty or invalid');
      }

      this.logger.log(`Extracted text length: ${text.length} characters`);
      
      // Очищаем и разбиваем текст
      const cleanedText = ChromaUtils.cleanText(text);
      const documents = await ChromaUtils.splitText(cleanedText);
      
      // Добавляем метаданные
      const documentsWithMetadata = documents.map((doc, index) => {
        doc.metadata = ChromaUtils.createMetadata(file.originalname, index);
        return doc;
      });

      // Добавляем документы в векторную БД через RAG сервис
      const texts = documentsWithMetadata.map(doc => doc.pageContent);
      await this.ragService.addDocuments(texts);
      
      this.logger.log('✅ File processed successfully');
      
    } catch (error) {
      this.logger.error('❌ Error processing file:', error);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    let text = '';
    
    if (file.mimetype === 'application/pdf') {
      this.logger.log('Processing PDF file...');
      const pdf = await pdfParse(file.buffer);
      text = pdf.text;
    } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      this.logger.log('Processing text file...');
      text = file.buffer.toString('utf-8');
    } else {
      this.logger.warn(`Unsupported file type: ${file.mimetype}, trying as text...`);
      text = file.buffer.toString('utf-8');
    }

    return text;
  }

  // Получение статистики базы знаний
  async getKnowledgeBaseStats(): Promise<{
    status: string;
    documentsCount: number;
    lastUpdated?: Date;
    chromadbStatus?: string;
  }> {
    try {
      const ragStatus = await this.ragService.getStatus();
      const connectionTest = await ChromaUtils.testConnection();
      
      return {
        status: ragStatus.isInitialized ? 'ready' : 'not_initialized',
        documentsCount: ragStatus.hasVectorStore ? 1 : 0, // Приблизительно
        lastUpdated: new Date(),
        chromadbStatus: connectionTest.success ? 'connected' : 'disconnected'
      };
    } catch (error) {
      this.logger.error('Error getting knowledge base stats:', error);
      return {
        status: 'error',
        documentsCount: 0
      };
    }
  }

  // Тестирование базы знаний
  async testKnowledgeBase(query: string = 'информация о клинике'): Promise<{
    success: boolean;
    response?: string;
    searchResults?: any[];
    error?: string;
  }> {
    try {
      // Тестируем поиск
      const searchTest = await this.ragService.testSearch(query);
      
      if (!searchTest.success) {
        return {
          success: false,
          error: searchTest.error
        };
      }

      // Тестируем полный RAG пайплайн
      const response = await this.ragService.ask(query);
      
      return {
        success: true,
        response,
        searchResults: searchTest.results
      };
    } catch (error) {
      this.logger.error('Error testing knowledge base:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Диагностика системы
  async diagnoseSystem(): Promise<{
    chromadb: { status: string; message: string };
    ragService: { initialized: boolean; hasData: boolean };
    openai: { configured: boolean };
  }> {
    const chromaTest = await ChromaUtils.testConnection();
    const ragStatus = await this.ragService.getStatus();
    
    return {
      chromadb: {
        status: chromaTest.success ? 'ok' : 'error',
        message: chromaTest.message
      },
      ragService: {
        initialized: ragStatus.isInitialized,
        hasData: ragStatus.hasVectorStore
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY
      }
    };
  }
}