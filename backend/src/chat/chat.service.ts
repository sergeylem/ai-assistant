// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common'
import { OpenAIService } from '../openai/openai.service'

@Injectable()
export class ChatService {
  constructor(private openai: OpenAIService) {}

  async handleMessage(message: string): Promise<string> {
    return await this.openai.ask(message)
  }
}
