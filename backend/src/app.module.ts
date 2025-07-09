import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'
import { ChatModule } from './chat/chat.module'
import { KnowledgeModule } from './knowledge/knowledge.module'

@Module({
  imports: [ConfigModule.forRoot(), ChatModule, KnowledgeModule],
})
export class AppModule {}
