// src/rag/chroma.ts
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export async function createChromaFromText(text: string, collectionName: string) {
  const splitter = new RecursiveCharacterTextSplitter({ 
    chunkSize: 500, 
    chunkOverlap: 50 
  });
  
  const docs = await splitter.createDocuments([text]);
  
  console.log('Creating embeddings...');
  const embeddings = new OpenAIEmbeddings();
  
  // Check if collection exists
  let store: Chroma;
  
  try {
    // Try to connect to an existing collection
    store = await Chroma.fromExistingCollection(embeddings, {
      collectionName,
      url: 'http://localhost:8000',
    });
    console.log('Connected to existing collection');
    
    // Add new documents to the existing collection
    await store.addDocuments(docs);
    console.log('Documents added to existing collection');
    
  } catch (err) {
    console.log('Collection not found, creating new one...');
    
    // Create a new collection with documents
    store = await Chroma.fromDocuments(docs, embeddings, {
      collectionName,
      url: 'http://localhost:8000',
    });
    console.log('New collection created with documents');
  }
  
  return store;
}

// Additional function to clear the collection
export async function clearChromaCollection(collectionName: string) {
  try {
    const embeddings = new OpenAIEmbeddings();
    const store = await Chroma.fromExistingCollection(embeddings, {
      collectionName,
      url: 'http://localhost:8000',
    });
    
    // Get all documents from the collection
    const allDocs = await store.similaritySearch('', 1000); // Get maximum documents
    
    if (allDocs.length > 0) {
      // If there are documents, delete them by filter (delete all)
      await store.delete({
        filter: {} // Empty filter means delete all documents
      });
      console.log(`Collection ${collectionName} cleared, deleted ${allDocs.length} documents`);
    } else {
      console.log(`Collection ${collectionName} is already empty`);
    }
    
  } catch (error) {
    console.error('Error clearing collection:', error);
  }
}

// Alternative function to delete the collection completely
export async function deleteChromaCollection(collectionName: string) {
  try {
    // For complete collection deletion, you can use the direct ChromaDB API
    const response = await fetch(`http://localhost:8000/api/v1/collections/${collectionName}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      console.log(`Collection ${collectionName} deleted successfully`);
    } else {
      console.error(`Failed to delete collection ${collectionName}:`, response.statusText);
    }
    
  } catch (error) {
    console.error('Error deleting collection:', error);
  }
}