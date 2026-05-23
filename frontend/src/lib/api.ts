import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
});

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    let deviceId = localStorage.getItem("mnemosyne_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("mnemosyne_device_id", deviceId);
    }
    config.headers["X-User-ID"] = deviceId;
  }
  return config;
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
  generateQuestions: (documentId: string, studyMode: string = "notes") =>
    API.post(`/api/recall/generate/${documentId}?study_mode=${studyMode}`),
  getStudySession: (documentId: string, studyMode: string = "notes") =>
    API.get(`/api/recall/session/${documentId}?study_mode=${studyMode}`),
};

export const tutorAPI = {
  chat: (message: string, documentId?: string, sessionId?: string, studyMode: string = "notes") =>
    API.post("/api/tutor/chat", { message, document_id: documentId, session_id: sessionId, study_mode: studyMode }),
};

export const aiAPI = {
  health: () => API.get("/api/ai/health"),
  extractionProgress: (documentId: string) => API.get(`/api/extraction/progress/${documentId}`),
};

export default API;
