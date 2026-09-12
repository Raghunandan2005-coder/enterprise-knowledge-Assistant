# enterprise-knowledge-Assistant

An ADK-based Agentic RAG application for retrieving and answering questions from enterprise policy documents and dynamically uploaded PDFs.

The system combines hybrid retrieval, local embeddings, CrossEncoder reranking, Google ADK tool calling, and Gemini-based grounded generation to help employees quickly find relevant information from organizational documents.

Problem Statement

Employees often need to search internal portals, open lengthy policy documents, locate the correct section, and manually interpret organizational policies.

A general-purpose LLM may not have access to private organizational knowledge and can provide outdated or hallucinated information.

The Enterprise Knowledge Assistant addresses this by retrieving relevant information from organizational documents before generating an answer, allowing responses to remain grounded in the available knowledge base.

Architecture

text
Employee
   |
   v
Next.js Chat Interface
   |
   v
Next.js /api/chat
   |
   v
Google ADK API Server
   |
   v
ADK Agent (Gemini)
   |
   v
retrieve_documents() Tool
   |
   +-------------------------------+
   |                               |
   v                               v
Permanent Knowledge Base      Uploaded PDF
BM25 + Dense Retrieval        Dense Retrieval
   |                               |
   +---------------+---------------+
                   |
                   v
          Candidate Documents
                   |
                   v
          CrossEncoder Reranker
                   |
                   v
              Top 4 Chunks
                   |
                   v
              ADK Agent
                   |
                   v
      Grounded Answer + Citations


RAG is exposed as a tool to the ADK agent rather than being treated as the agent itself.

## Retrieval Pipeline

Enterprise policy PDFs are loaded using PyPDFLoader and split using RecursiveCharacterTextSplitter.

The current configuration uses:

- Chunk size: 1000
- Chunk overlap: 150
- Embedding model: nomic-embed-text through Ollama
- Vector database: ChromaDB
- Dense retrieval: Top 6 candidates
- BM25 retrieval: Top 6 candidates
- Hybrid weights: 60% dense / 40% BM25
- Reranker: cross-encoder/ms-marco-MiniLM-L6-v2
- Final context: Top 4 reranked chunks

Dense retrieval captures semantic similarity, while BM25 improves lexical matching for exact policy names, terminology, and phrases.

The candidate chunks are reranked using a CrossEncoder before being provided to the agent for grounded generation.

## Dynamic PDF Upload

The application also supports PDF upload through the Next.js interface.

text
Next.js UI
    |
    v
/api/upload
    |
    v
FastAPI Upload Service
    |
    v
Save Uploaded PDF
    |
    v
Load and Chunk Document
    |
    v
nomic-embed-text
    |
    v
Temporary ChromaDB Collection


Uploaded documents are kept separate from the permanent enterprise knowledge base because they have a different lifecycle.

When a new PDF is uploaded, the previous temporary vector records are cleared and the new document is indexed. This prevents temporary user-provided knowledge from being permanently mixed with the enterprise knowledge base.

During retrieval, candidates from the permanent knowledge base and uploaded document are combined and reranked together.

## Agent Layer

Google ADK is used to implement the agent layer.

The retrieval pipeline is exposed to the agent through the retrieve_documents() tool.

The agent can invoke this tool to obtain relevant document context and then use Gemini to generate a grounded response based on the retrieved evidence.

The agent is instructed to avoid inventing information when relevant evidence is unavailable and to provide source and page information when available.

 Technology Stack

| Component | Technology |
| --- | --- |
| Agent Framework | Google ADK |
| Generation Model | Gemini 3.5 Flash |
| Embeddings | Ollama `nomic-embed-text` |
| Vector Database | ChromaDB |
| Keyword Retrieval | BM25 |
| Semantic Retrieval | Dense Vector Search |
| Retrieval Strategy | Hybrid Retrieval |
| Reranking | CrossEncoder |
| Document Processing | LangChain |
| PDF Loader | PyPDFLoader |
| Upload Service | FastAPI |
| Frontend | Next.js / TypeScript |
| Styling | Tailwind CSS |

## Knowledge Base

The initial enterprise knowledge base was built using six organizational HR policy documents containing:

- 133 pages
- 462 indexed chunks

The documents cover areas such as corrective action, professional development, performance management, complaint resolution, absence from work, and compensation.

The architecture can be extended to other enterprise knowledge sources.

 Evaluation

The retrieval pipeline was evaluated using a controlled five-query benchmark.

| Metric | Result |
| --- | ---: |
| Source Accuracy | 100% |
| Source-based Precision@4 | 90% |
| Average Retrieval Latency | 1.27 seconds |

These results represent a small controlled evaluation set and should not be interpreted as production-scale benchmarking.

## Project Structure

text
EnterpriseKnwoledgeassistant/
|
|-- src/
|   |-- ingestion.py
|   |-- Embeddings.py
|   |-- retrieval.py
|   |-- eval_dataset.py
|
|-- frontend/
|   |-- app/
|   |   |-- api/
|   |   |   |-- chat/
|   |   |   |-- upload/
|   |   |-- page.tsx
|   |   |-- layout.tsx
|   |   |-- globals.css
|   |
|   |-- package.json
|
|-- agent.py
|-- upload_api.py
|-- evaluation_retrieval.py
|-- requirements.txt
|-- .gitignore
|-- README.md
|-- __init__.py


Local vector databases, uploaded documents, environment files, Python virtual environments, Next.js build files, and dependencies are excluded from version control.

## Running Locally

### Prerequisites

Install:

- Python 3.10+
- Node.js
- Ollama

Pull the embedding model:

```bash
ollama pull nomic-embed-text
```

Create a Python virtual environment and install the required dependencies:

```bash
pip install -r requirements.txt
```

Configure the required Gemini credentials in a local `.env` file.

The `.env` file should never be committed to GitHub.

### Start the ADK Backend

From the directory containing the `EnterpriseKnwoledgeassistant` package:

```bash
adk api_server
```

The ADK API server runs on:

```text
http://127.0.0.1:8000
```

### Start the PDF Upload Service

In a second terminal:

```bash
uvicorn EnterpriseKnwoledgeassistant.upload_api:app --host 127.0.0.1 --port 8001
```

The upload service runs on:

```text
http://127.0.0.1:8001
```

### Start the Frontend

In a third terminal:

```bash
cd EnterpriseKnwoledgeassistant/frontend
npm install
npm run dev
```

Open the application in the browser at:

```text
http://localhost:3000
```

## Current Limitations

This project is currently a portfolio V1 implementation.

The uploaded-document knowledge base supports one active temporary PDF index at a time. Authentication, user-level document isolation, persistent multi-user uploads, access-control-aware retrieval, cloud deployment, and enterprise observability are not yet implemented.

These would be important additions before deploying the system in a production enterprise environment.

## Future Improvements

Potential extensions include multi-user document isolation, role-based access control, hybrid retrieval for dynamically uploaded documents, persistent conversation memory, cloud deployment, retrieval observability, larger evaluation datasets, and integration with enterprise data sources.

## Author

Raghu Nandan Reddy  
B.Tech - Artificial Intelligence & Data Science
