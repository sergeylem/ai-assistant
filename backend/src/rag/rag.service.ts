import { readFileSync } from "fs";
import { join } from "path";

import { Injectable } from '@nestjs/common';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { RunnableSequence } from 'langchain/schema/runnable';
import { formatDocumentsAsString } from 'langchain/util/document';
import { ChatPromptTemplate } from 'langchain/prompts';

@Injectable()
export class RagService {
  private chain: RunnableSequence;

  constructor() {
    const model = new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0 });

    const vectorStore = new Chroma(new OpenAIEmbeddings(), {
      collectionName: 'dental-faq',
      url: 'http://localhost:8000',
    });

    const retriever = vectorStore.asRetriever();

    const promptText = readFileSync(
      join(process.cwd(), 'src', 'prompts.txt'),
      "utf-8"
    );

    const prompt = ChatPromptTemplate.fromTemplate(promptText);

    this.chain = RunnableSequence.from([
      {
        question: (input: { question: string }) => input.question,
        context: async (input: { question: string }) => {
          const docs = await retriever.invoke(input.question);
          return formatDocumentsAsString(docs);
        },
      },
      prompt,
      model,
    ]);
  }

  async ask(question: string): Promise<string> {
    const result = await this.chain.invoke({ question });
    return result.content;
  }
}
