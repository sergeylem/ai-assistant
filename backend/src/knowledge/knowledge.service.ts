// knowledge.service.ts
import { Injectable } from '@nestjs/common'
import { createChromaFromText } from '../rag/chroma'
import * as pdfParse from 'pdf-parse'

@Injectable()
export class KnowledgeService {
  async processFile(file: Express.Multer.File) {
    let text = ''
    if (file.mimetype === 'application/pdf') {
      const pdf = await pdfParse(file.buffer)
      text = pdf.text
    } else {
      text = file.buffer.toString('utf-8')
      console.log('Received file:', file);
    }

    await createChromaFromText(text, 'dental-faq')
  }
}
