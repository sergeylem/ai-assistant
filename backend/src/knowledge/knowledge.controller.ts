// knowledge.controller.ts
import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
  } from '@nestjs/common'
  import { FileInterceptor } from '@nestjs/platform-express'
  import { KnowledgeService } from './knowledge.service'
  
  @Controller('knowledge')
  export class KnowledgeController {
    constructor(private readonly service: KnowledgeService) {}
  
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
      await this.service.processFile(file)
      return { status: 'ok' }
    }
  }
  