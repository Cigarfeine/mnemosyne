import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
});

export const documentsAPI = {
  upload: (file: File, subject: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("subject", subject);
    return API.post("/api/documents/upload", form);
  },
  list: () => API.get("/api/documents/"),
  get: (id: string) => API.get(`/api/documents/${id}`),
  delete: (id: string) => API.delete(`/api/documents/${id}`),
};

export const conceptsAPI = {
  extract: (documentId: string) => API.post(`/api/concepts/extract/${documentId}`),
  getGraph: (documentId: string) => API.get(`/api/concepts/graph/${documentId}`),
  list: (documentId: string) => API.get(`/api/concepts/${documentId}`),
};

export const memoryAPI = {
  getDueReviews: () => API.get("/api/memory/due"),
  submitReview: (conceptId: string, quality: number) =>
    API.post("/api/memory/review", { concept_id: conceptId, quality }),
  getStats: () => API.get("/api/memory/stats"),
  getWeakConcepts: () => API.get("/api/memory/weak-concepts"),
};

export const recallAPI = {
  getQuestions: (conceptId: string) => API.get(`/api/recall/questions/${conceptId}`),
  generateQuestions: (documentId: string) => API.post(`/api/recall/generate/${documentId}`),
  getStudySession: (documentId: string) => API.get(`/api/recall/session/${documentId}`),
};

export const tutorAPI = {
  chat: (message: string, documentId?: string, sessionId?: string) =>
    API.post("/api/tutor/chat", { message, document_id: documentId, session_id: sessionId }),
};

export default API;
