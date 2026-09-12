from pathlib import Path
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from .ingestion import load_and_split_documents
from langchain_community.retrievers import BM25Retriever
from langchain_classic.retrievers import EnsembleRetriever
from sentence_transformers import CrossEncoder

BASE_DIR=Path(__file__).resolve().parent.parent

CHROMA_DIR = BASE_DIR / "chroma_db"
TEMP_CHROMA_DIR = BASE_DIR / "temp_chroma_db"
embeddings = OllamaEmbeddings(
    model="nomic-embed-text"
)

# Permanent Enterprise Knowledge Base
db=Chroma(
    collection_name="enterprise_knowledge",
    embedding_function=embeddings,
    persist_directory=str(CHROMA_DIR)
    
)


print("Stored records:",db._collection.count())

# BM25 Retriever 
chunks=load_and_split_documents()

bm25_retriever=BM25Retriever.from_documents(chunks)
bm25_retriever.k=6


# permanent Dense retriever.
dense_retriever=db.as_retriever(
    search_kwargs={"k":6}
)

# Existing Hybrid Retriever

hybrid_retriever=EnsembleRetriever(
    retrievers=[bm25_retriever,dense_retriever],
    weights=[0.4,0.6]
)


# Temporary uploaded-document database
temp_db = Chroma(
    collection_name="uploaded_document",
    embedding_function=embeddings,
    persist_directory=str(TEMP_CHROMA_DIR)
)


temp_dense_retriever = temp_db.as_retriever(
    search_kwargs={"k": 6}
)








reranker=CrossEncoder("cross-encoder/ms-marco-MiniLM-L6-v2")




def retrieve_documents(query:str):

 
    results=hybrid_retriever.invoke(query)
    
    if temp_db._collection.count() > 0:
    
        uploaded_results = temp_dense_retriever.invoke(query)

        results.extend(uploaded_results)

    # Cross encoder Reranking 
    pairs=[]
    for doc in results:
        pairs.append([query,doc.page_content])
    scores = reranker.predict(pairs)
    reranked_results=sorted(
        zip(results,scores),
        key=lambda x:x[1],
        reverse=True
    )    
    top_results=reranked_results[:4]
    
    formatted_results=[]
    
    for doc,score in top_results:
        formatted_results.append({
            "content":doc.page_content,
            "source":doc.metadata.get("source"),
            "page":doc.metadata.get("page_label")
        })
    
    return formatted_results
    
    
    
if __name__ == "__main__":
    
    query = "What is the employee Performance Appraisal?"

    results = retrieve_documents(query)

    print("\n--- RERANKED RESULTS ---")

    for i, doc in enumerate(results, start=1):
        print(f"\nResult {i}")
        print("Content:", doc["content"][:500])
        print("Source:", doc["source"])
        print("Page:", doc["page"])