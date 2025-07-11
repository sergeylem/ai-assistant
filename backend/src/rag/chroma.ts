// src/rag/chroma.utils.ts - Упрощенная версия без сложной логики
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

export class ChromaUtils {
  // Разбиение текста на чанки
  static async splitText(text: string): Promise<Document[]> {
    console.log(`Splitting text of length: ${text.length} characters`);
    
    const splitter = new RecursiveCharacterTextSplitter({ 
      chunkSize: 1000,  // Увеличили размер чанка
      chunkOverlap: 100,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });
    
    const docs = await splitter.createDocuments([text]);
    console.log(`Split into ${docs.length} chunks`);
    
    return docs;
  }

  // Проверка соединения с ChromaDB
  static async testConnection(url: string = 'http://localhost:8000'): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Простая проверка доступности ChromaDB
      const response = await fetch(`${url}/api/v1/heartbeat`);
      
      if (response.ok) {
        return {
          success: true,
          message: 'ChromaDB is accessible'
        };
      } else {
        return {
          success: false,
          message: `ChromaDB returned status: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Cannot connect to ChromaDB: ${error.message}`
      };
    }
  }

  // Создание метаданных для документов
  static createMetadata(filename: string, chunkIndex: number): Record<string, any> {
    return {
      source: filename,
      chunk: chunkIndex,
      timestamp: new Date().toISOString(),
      type: 'clinic_document'
    };
  }

  // Очистка текста перед обработкой
  static cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')  // Нормализация переносов строк
      .replace(/\s+/g, ' ')    // Убираем лишние пробелы
      .trim();
  }

  // Проверка валидности текста
  static isValidText(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    const cleanedText = this.cleanText(text);
    return cleanedText.length > 10; // Минимум 10 символов
  }
}