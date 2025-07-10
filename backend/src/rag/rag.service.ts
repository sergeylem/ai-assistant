// src/rag/rag.service.ts - Упрощенная и стабильная версия
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from '@langchain/core/documents';

@Injectable()
export class RagService implements OnModuleInit {
  private vectorStore: Chroma | null = null;
  private model: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private readonly logger = new Logger(RagService.name);

  constructor() {
    // Инициализация моделей в конструкторе
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002',
    });
  }

  async onModuleInit() {
    await this.initializeVectorStore();
  }

  private async initializeVectorStore() {
    try {
      this.logger.log('Attempting to connect to ChromaDB...');
      
      // For ChromaDB v2, we need to handle tenant creation
      const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
      
      this.vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
        collectionName: 'dental-faq',
        url: chromaUrl,
        collectionMetadata: {
          "hnsw:space": "cosine"
        }
      });
      
      this.logger.log('✅ Connected to existing ChromaDB collection');
    } catch (error) {
      this.logger.warn('⚠️ ChromaDB collection not found - will be created when documents are uploaded');
      this.logger.debug('Error details:', error.message);
      this.vectorStore = null;
    }
  }

  async ask(question: string): Promise<string> {
    try {
      // Проверяем доступность векторной БД
      if (!this.vectorStore) {
        return 'Извините, база знаний пока не загружена. Пожалуйста, загрузите документы через API /knowledge/upload.';
      }

      this.logger.log(`Processing question: ${question.substring(0, 50)}...`);

      // Поиск релевантных документов
      const relevantDocs = await this.vectorStore.similaritySearch(question, 4);
      
      if (!relevantDocs || relevantDocs.length === 0) {
        return 'Извините, я не нашел информации по вашему вопросу в базе знаний клиники.';
      }

      // Формируем контекст из найденных документов
      const context = relevantDocs
        .map(doc => doc.pageContent)
        .join('\n\n');

      // Создаем промпт
      const prompt = this.buildPrompt(context, question);

      // Получаем ответ от AI
      const response = await this.model.invoke([{ role: 'user', content: prompt }]);
      
      this.logger.log('✅ RAG response generated successfully');
      return response.content as string;

    } catch (error) {
      this.logger.error('❌ Error in RAG service:', error);
      
      // Обработка различных типов ошибок
      if (error.message.includes('Collection') || error.message.includes('not found')) {
        return 'Извините, база знаний временно недоступна. Попробуйте позже.';
      }
      
      if (error.message.includes('OpenAI') || error.message.includes('API')) {
        return 'Извините, временные проблемы с AI-сервисом. Попробуйте чуть позже.';
      }
      
      throw error; // Для fallback в ChatService
    }
  }

  private buildPrompt(context: string, question: string): string {
    return `Ты — умный помощник стоматологической клиники "BrightSmile" в Астане.

ВАЖНЫЕ ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе предоставленного контекста
2. Если ответа нет в контексте — скажи "Извините, у меня нет такой информации в базе знаний"
3. Будь дружелюбным и профессиональным
4. Цены указывай в тенге
5. Не придумывай информацию

КОНТЕКСТ ИЗ БАЗЫ ЗНАНИЙ:
${context}

ВОПРОС ПАЦИЕНТА:
${question}

ОТВЕТ:`;
  }

  // Метод для добавления документов в векторную БД
  async addDocuments(texts: string[], collectionName: string = 'dental-faq'): Promise<void> {
    try {
      this.logger.log(`Adding documents to collection: ${collectionName}`);

      // Создаем документы
      const documents = texts.map(text => new Document({ pageContent: text }));

      if (!this.vectorStore) {
        // Создаем новую коллекцию для ChromaDB v2
        const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
        
        this.vectorStore = await Chroma.fromDocuments(documents, this.embeddings, {
          collectionName,
          url: chromaUrl,
          collectionMetadata: {
            "hnsw:space": "cosine"
          }
        });
        this.logger.log('✅ Created new ChromaDB collection');
      } else {
        // Добавляем в существующую
        await this.vectorStore.addDocuments(documents);
        this.logger.log('✅ Added documents to existing collection');
      }

    } catch (error) {
      this.logger.error('❌ Error adding documents:', error);
      throw new Error(`Failed to add documents: ${error.message}`);
    }
  }

  // Переинициализация после загрузки новых данных
  async reinitialize(): Promise<void> {
    this.logger.log('Reinitializing RAG service...');
    this.vectorStore = null;
    await this.initializeVectorStore();
  }

  // Проверка статуса
  async getStatus(): Promise<{
    isInitialized: boolean;
    hasVectorStore: boolean;
    collectionName: string;
  }> {
    return {
      isInitialized: !!this.vectorStore,
      hasVectorStore: !!this.vectorStore,
      collectionName: 'dental-faq'
    };
  }

  // Тестирование поиска
  async testSearch(query: string): Promise<{
    success: boolean;
    results: any[];
    error?: string;
  }> {
    try {
      if (!this.vectorStore) {
        return {
          success: false,
          results: [],
          error: 'Vector store not initialized'
        };
      }

      const results = await this.vectorStore.similaritySearch(query, 3);
      
      return {
        success: true,
        results: results.map(doc => ({
          content: doc.pageContent.substring(0, 200) + '...',
          metadata: doc.metadata
        }))
      };

    } catch (error) {
      return {
        success: false,
        results: [],
        error: error.message
      };
    }
  }
}