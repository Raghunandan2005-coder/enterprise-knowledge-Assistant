from pathlib import Path
from langchain_ollama import OllamaEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
DATA_DIR =Path(__file__).resolve().parent.parent/"data"

def load_and_split_documents(uploaded_file_path=None):
    

    all_documents = []

    # Case 1: User uploaded a PDF
    if uploaded_file_path:
        pdf_files = [Path(uploaded_file_path)]

    # Case 2: Use existing enterprise PDFs
    else:
        pdf_files = list(DATA_DIR.glob("*.pdf"))

    print("pdf files found:", len(pdf_files))
    print("pdf files:", pdf_files)

    for pdf_file in pdf_files:
        print("Loading:", pdf_file.name)
    
        loader=PyPDFLoader(str(pdf_file))
        documents=loader.load()
        all_documents.extend(documents)
    print("Total Pages loaded:",len(all_documents))

    text_splitter=RecursiveCharacterTextSplitter(
         chunk_size=1000,
         chunk_overlap=150
)

    chunks=text_splitter.split_documents(all_documents)
    print("total chunks:",len(chunks))
    return chunks


if __name__ == "__main__":
    
    embeddings = OllamaEmbeddings(
        model="nomic-embed-text"
    )

    test_vector = embeddings.embed_query(
        "What is the employee leave policy?"
    )

    print("\n--- EMBEDDING TEST ---")
    print("Embedding dimensions:", len(test_vector))
    print("First 100 values:", test_vector[:100])