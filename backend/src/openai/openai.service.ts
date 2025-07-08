// src/openai/openai.service.ts
import { Injectable } from '@nestjs/common'
import { OpenAI } from 'openai'

@Injectable()
export class OpenAIService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async ask(question: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: question }],
    })

    return completion.choices[0].message.content ?? ''
  }
}
