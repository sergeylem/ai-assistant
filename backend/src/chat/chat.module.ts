// src/chat/chat.module.ts
import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { OpenAIService } from '../openai/openai.service'
import { RagService } from '../rag/rag.service'

@Module({
  controllers: [ChatController],
  providers: [ChatService, OpenAIService, RagService],
})
export class ChatModule {}
