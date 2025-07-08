// src/rag/chroma.ts
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

export async function createChromaFromText(text: string, collectionName: string) {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
  const docs = await splitter.createDocuments([text])

  const store = await Chroma.fromDocuments(docs, new OpenAIEmbeddings(), {
    collectionName,
    url: 'http://localhost:8000', // for local ChromaDB
  })

  return store
}
