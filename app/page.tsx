'use client';

import { ChangeEvent, FormEvent, useState } from "react";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: trimmedInput,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get a response from the assistant.");
      }

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: data.answer || "I could not generate an answer.",
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are allowed.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    setUploadError("");
    setUploadSuccess("");
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setUploadError("Please select a PDF file first.");
      return;
    }

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are allowed.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "PDF upload failed.");
      }

      setUploadSuccess(`Uploaded successfully: ${selectedFile.name}`);
      setSelectedFile(null);
      const fileInput = document.getElementById("pdf-upload") as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while uploading the PDF.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">
        <header className="border-b border-slate-200 px-6 py-6 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            Enterprise Knowledge Assistant
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Enterprise Knowledge Assistant
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Ask questions from enterprise documents
          </p>
        </header>

        <section className="p-4 sm:p-6">
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isUploading ? "Uploading..." : "Upload PDF"}
              </button>
            </div>

            {uploadError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {uploadSuccess}
              </div>
            )}
          </div>

          <div className="flex min-h-[420px] flex-col justify-between">
            <div className="space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center">
                  <div>
                    <p className="text-lg font-semibold text-slate-700">
                      Ask your first question
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Use the chat box below to search your enterprise knowledge base.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:text-base ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your question here..."
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
