from pathlib import Path

from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from .ingestion import load_and_split_documents



BASE_DIR = Path(__file__).resolve().parent.parent
CHROMA_DIR = BASE_DIR / "chroma_db"
TEMP_CHROMA_DIR = BASE_DIR / "temp_chroma_db"


def create_vector_database():

     chunks=load_and_split_documents()

     print("Chunks received:",len(chunks))

     embeddings=OllamaEmbeddings(model="nomic-embed-text")

     db=Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR),
        collection_name="enterprise_knowledge"
     )
     print("Total records in ChromaDB:",db._collection.count())
    
     return db
  
def create_temporary_vector_database(uploaded_file_path):
    
    chunks = load_and_split_documents(uploaded_file_path)

    print("Uploaded document chunks:", len(chunks))

    embeddings = OllamaEmbeddings(
        model="nomic-embed-text"
    )

    temp_db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(TEMP_CHROMA_DIR),
        collection_name="uploaded_document"
    )

    print(
        "Temporary records in ChromaDB:",
        temp_db._collection.count()
    )

    return temp_db