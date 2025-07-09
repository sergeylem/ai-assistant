// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common'
import { OpenAIService } from '../openai/openai.service'
import { RagService } from '../rag/rag.service'

@Injectable()
export class ChatService {
  constructor(
    private openai: OpenAIService,
    private ragService: RagService
  ) {}

  async handleMessage(message: string): Promise<string> {
    try {
      // Try to get an answer from the knowledge base first
      const ragResponse = await this.ragService.ask(message)
      
      // If RAG didn't give an answer or the answer is incomplete, use the general model
      if (ragResponse.includes('не знаю') || ragResponse.length < 20) {
        return await this.openai.ask(message)
      }
      
      return ragResponse
    } catch (error) {
      console.error('Error in chat service:', error)
      // Fallback на обычный OpenAI в случае ошибки RAG
      return await this.openai.ask(message)
    }
  }

  // New method to force using only the knowledge base
  async askFromKnowledgeBase(message: string): Promise<string> {
    return await this.ragService.ask(message)
  }

  // New method for general questions (not related to the clinic)
  async askGeneral(message: string): Promise<string> {
    return await this.openai.ask(message)
  }
}