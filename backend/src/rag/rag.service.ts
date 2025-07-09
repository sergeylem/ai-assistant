// src/rag/rag.service.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
// If the import doesn't work, create your own function
const formatDocumentsAsString = (docs: any[]) => {
  return docs.map(doc => doc.pageContent).join('\n\n');
};

// import { formatDocumentsAsString } from 'langchain/util/document';

@Injectable()
export class RagService {
  private chain: RunnableSequence;

  constructor() {
    const model = new ChatOpenAI({ 
      model: 'gpt-4o', 
      temperature: 0 
    });

    const vectorStore = new Chroma(new OpenAIEmbeddings(), {
      collectionName: 'dental-faq',
      url: 'http://localhost:8000',
    });

    const retriever = vectorStore.asRetriever({
      k: 4, // number of documents to retrieve
      searchType: 'similarity',
    });

    const promptText = readFileSync(join(process.cwd(), 'src', 'prompts.txt'), 'utf-8');
    const prompt = ChatPromptTemplate.fromTemplate(promptText);

    // Create a chain using the new API
    this.chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString),
        question: new RunnablePassthrough(),
      },
      prompt,
      model,
      new StringOutputParser(),
    ]);
  }

  async ask(question: string): Promise<string> {
    try {
      const result = await this.chain.invoke(question);
      return result;
    } catch (error) {
      console.error('Error in RAG service:', error);
      throw new Error('Failed to process question');
    }
  }
}