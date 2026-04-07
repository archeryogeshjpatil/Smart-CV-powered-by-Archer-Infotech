import axios from "axios";

const API_BASE = "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE });

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("smartcv_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- Auth ---

export async function signup(email: string, password: string) {
  const { data } = await api.post("/auth/signup", { email, password });
  localStorage.setItem("smartcv_token", data.token);
  localStorage.setItem("smartcv_user", JSON.stringify(data.user));
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("smartcv_token", data.token);
  localStorage.setItem("smartcv_user", JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem("smartcv_token");
  localStorage.removeItem("smartcv_user");
}

export function getStoredUser(): { id: string; email: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("smartcv_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("smartcv_token");
}

export async function verifyAuth(): Promise<{ id: string; email: string } | null> {
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch {
    logout();
    return null;
  }
}

// --- Resume Analysis ---

export async function analyzeResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/analyze", formData);
  return data;
}

// --- History ---

export async function saveHistory(
  fileName: string,
  atsScore: number,
  details: Record<string, unknown>,
  analysis: Record<string, unknown>
) {
  const { data } = await api.post("/history/save", {
    file_name: fileName,
    ats_score: atsScore,
    details,
    analysis,
  });
  return data;
}

export async function getHistory() {
  const { data } = await api.get("/history");
  return data;
}

export async function deleteHistory(entryId: string) {
  const { data } = await api.delete(`/history/${entryId}`);
  return data;
}

// --- Regenerate ---

export type ClarifyQuestion = {
  id: string;
  question: string;
  placeholder: string;
  type: "text" | "textarea" | "url";
};

export async function getClarifyingQuestions(
  resumeText: string,
  details: Record<string, unknown>,
  defects: string[],
  recommendations: string[]
) {
  const { data } = await api.post("/regenerate/questions", {
    resume_text: resumeText,
    details,
    defects,
    recommendations,
  });
  return data as { questions: ClarifyQuestion[] };
}

export async function regenerateResume(
  resumeText: string,
  details: Record<string, unknown>,
  defects: string[],
  recommendations: string[],
  userAnswers: Record<string, string>
) {
  const { data } = await api.post("/regenerate", {
    resume_text: resumeText,
    details,
    defects,
    recommendations,
    user_answers: userAnswers,
  });
  return data;
}

// Store regenerated CV data for the CV Generator page
export function storeRegeneratedCV(cvData: Record<string, unknown>) {
  localStorage.setItem("smartcv_regenerated", JSON.stringify(cvData));
}

export function getRegeneratedCV(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("smartcv_regenerated");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    localStorage.removeItem("smartcv_regenerated"); // one-time use
    return data;
  } catch {
    return null;
  }
}

// --- Types ---

export type ResumeHistory = {
  id: string;
  user_id: string;
  file_name: string;
  ats_score: number;
  details: Record<string, unknown>;
  analysis: {
    defects: string[];
    recommendations: string[];
  };
  created_at: string;
};
