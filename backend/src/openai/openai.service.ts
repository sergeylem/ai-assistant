// src/openai/openai.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { OpenAI } from 'openai'

@Injectable()
export class OpenAIService {
  private openai: OpenAI
  private readonly logger = new Logger(OpenAIService.name)

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    })
  }

  async ask(question: string, useLatestModel = true): Promise<string> {
    try {
      const model = useLatestModel ? 'gpt-4o-mini' : 'gpt-4o'
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `Ты - AI-ассистент стоматологической клиники "BrightSmile" в Астане. 
            Отвечай дружелюбно и профессионально. Если вопрос не касается стоматологии, 
            вежливо направь разговор к зубам и здоровью полости рта.`
          },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      return completion.choices[0].message.content ?? 'Извините, не могу ответить на этот вопрос.'
    } catch (error) {
      this.logger.error('Error calling OpenAI API:', error)
      throw new Error('Error processing the request')
    }
  }

  // Method for generating content (posts, emails)
  async generateContent(prompt: string, contentType: 'post' | 'email' | 'article'): Promise<string> {
    try {
      const systemPrompts = {
        post: 'Создай креативный пост для Instagram стоматологической клиники. Используй эмодзи, хештеги и призыв к действию.',
        email: 'Напиши профессиональное письмо для email-рассылки стоматологической клиники.',
        article: 'Напиши информативную статью о стоматологическом здоровье.'
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompts[contentType] },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      })

      return completion.choices[0].message.content ?? ''
    } catch (error) {
      this.logger.error('Error generating content:', error)
      throw new Error('Error generating content')
    }
  }
}