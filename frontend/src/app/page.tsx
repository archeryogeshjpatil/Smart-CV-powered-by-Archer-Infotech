"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  RotateCcw,
  Link as LinkIcon,
  GitBranch,
  ChevronRight,
  RefreshCw,
  LogIn,
  Send,
  Wand2,
  Cpu,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  analyzeResume,
  saveHistory,
  isLoggedIn,
  getClarifyingQuestions,
  regenerateResume,
  storeRegeneratedCV,
  type ClarifyQuestion,
} from "@/lib/api";

/** Returns empty string for null, "null", "N/A", undefined, etc. */
function clean(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  if (s === "" || s.toLowerCase() === "null" || s.toLowerCase() === "n/a" || s === "undefined" || s === "none") return "";
  return s;
}

export default function SmartCV() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Regeneration state
  const [regenStep, setRegenStep] = useState<"idle" | "loading-questions" | "questions" | "regenerating" | "done">("idle");
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [regenError, setRegenError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const questionsRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith(".pdf") || dropped.name.endsWith(".docx"))) {
      setFile(dropped);
    }
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await analyzeResume(file);
      setResult(data);
      // Store the resume text from the response for regeneration
      setResumeText(data._resume_text || "");

      // Save to history if logged in
      if (isLoggedIn()) {
        try {
          await saveHistory(
            file.name,
            data.ats_score || 0,
            data.details || {},
            data.analysis || { defects: [], recommendations: [] }
          );
        } catch {
          // non-critical
        }
      }
    } catch {
      setError("Failed to analyze resume. Ensure backend is running and your API key is set.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!isLoggedIn()) return;

    setRegenStep("loading-questions");
    setRegenError(null);

    try {
      const data = await getClarifyingQuestions(
        resumeText,
        rawDetails,
        analysis.defects || [],
        analysis.recommendations || []
      );

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setAnswers({});
        setRegenStep("questions");
        setTimeout(() => questionsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        // No questions needed — regenerate directly
        await doRegenerate({});
      }
    } catch {
      setRegenError("Failed to get clarifying questions. Please try again.");
      setRegenStep("idle");
    }
  };

  const doRegenerate = async (finalAnswers: Record<string, string>) => {
    setRegenStep("regenerating");
    setRegenError(null);

    try {
      const cvData = await regenerateResume(
        resumeText,
        rawDetails,
        analysis.defects || [],
        analysis.recommendations || [],
        finalAnswers
      );

      storeRegeneratedCV(cvData);
      setRegenStep("done");
      // Redirect to CV Generator
      router.push("/generate");
    } catch {
      setRegenError("Failed to regenerate resume. Please try again.");
      setRegenStep("questions");
    }
  };

  const handleSubmitAnswers = async () => {
    setSubmitting(true);
    await doRegenerate(answers);
    setSubmitting(false);
  };

  const rawDetails = (result?.details || {}) as Record<string, string | string[]>;
  const details = {
    name: clean(rawDetails.name),
    college_name: clean(rawDetails.college_name),
    email_id: clean(rawDetails.email_id),
    mobile_number: clean(rawDetails.mobile_number),
    github_link: clean(rawDetails.github_link),
    other_links: Array.isArray(rawDetails.other_links)
      ? rawDetails.other_links.map((l) => clean(l)).filter(Boolean)
      : [],
    skills: Array.isArray(rawDetails.skills)
      ? rawDetails.skills.map((s) => clean(s)).filter(Boolean)
      : [],
  };
  const analysis = (result?.analysis || { defects: [], recommendations: [] }) as {
    defects: string[];
    recommendations: string[];
  };
  const atsScore = (result?.ats_score || 0) as number;

  const scoreColor =
    atsScore >= 70 ? "text-emerald-400" : atsScore >= 40 ? "text-amber-400" : "text-red-400";
  const scoreGlow =
    atsScore >= 70
      ? "shadow-emerald-500/20"
      : atsScore >= 40
        ? "shadow-amber-500/20"
        : "shadow-red-500/20";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 md:px-8 py-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-indigo-300 mb-8">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered ATS Analysis
                </div>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Get Shortlisted
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  with AI
                </span>
              </motion.h1>

              <motion.p
                className="text-lg text-white/50 mb-12 max-w-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Upload your resume and get an instant ATS score, defect analysis,
                and smart optimization tips powered by Gemini AI.
              </motion.p>

              <motion.form
                onSubmit={handleUpload}
                className="w-full max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <label
                  className={`flex flex-col items-center justify-center w-full h-72 rounded-3xl cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? "glass-strong border-indigo-500/50 scale-[1.02]"
                      : "glass hover:border-indigo-500/30"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    {file ? (
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-indigo-400" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white/80">
                        {file ? file.name : "Drop your resume here"}
                      </p>
                      <p className="text-sm text-white/30 mt-1">
                        {file ? "Ready to analyze" : "PDF or DOCX — drag & drop or click"}
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>

                <button
                  disabled={!file || isLoading}
                  className="btn-glow mt-8 w-full py-4 text-lg flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Resume
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.form>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-red-400 text-sm glass px-4 py-3 rounded-xl"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
                  <p className="text-white/40 text-sm mt-1">
                    Resume: {file?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setResult(null);
                      setFile(null);
                      setRegenStep("idle");
                      setQuestions([]);
                      setAnswers({});
                    }}
                    className="btn-ghost px-5 py-2.5 flex items-center gap-2 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Analysis
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left column */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Score card */}
                  <motion.div
                    className={`glass p-8 text-center shadow-2xl ${scoreGlow}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div
                      className="score-ring mx-auto mb-6"
                      style={{ "--score": atsScore } as React.CSSProperties}
                    >
                      <span className={`relative z-10 text-4xl font-black ${scoreColor}`}>
                        {atsScore}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
                      ATS Score
                    </p>
                    <h3 className="text-xl font-bold text-white mt-2">
                      {details.name || "Anonymous User"}
                    </h3>
                    <p className="text-sm text-white/30 mt-1">
                      {atsScore >= 70
                        ? "Great resume! Minor tweaks needed."
                        : atsScore >= 40
                          ? "Good foundation. Room for improvement."
                          : "Needs significant improvements."}
                    </p>
                  </motion.div>

                  {/* Details card */}
                  <motion.div
                    className="glass p-6 space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-400" />
                      Profile Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      {details.college_name && (
                        <div className="flex items-start gap-3 text-white/60">
                          <GraduationCap className="w-4 h-4 mt-0.5 text-white/30 shrink-0" />
                          <span>{details.college_name}</span>
                        </div>
                      )}
                      {details.email_id && (
                        <div className="flex items-center gap-3 text-white/60">
                          <Mail className="w-4 h-4 text-white/30 shrink-0" />
                          <span>{details.email_id}</span>
                        </div>
                      )}
                      {details.mobile_number && (
                        <div className="flex items-center gap-3 text-white/60">
                          <Phone className="w-4 h-4 text-white/30 shrink-0" />
                          <span>{details.mobile_number}</span>
                        </div>
                      )}
                      {details.github_link && (
                        <a
                          href={details.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <GitBranch className="w-4 h-4 shrink-0" />
                          <span>GitHub Profile</span>
                        </a>
                      )}
                      {details.other_links?.length > 0 &&
                        details.other_links.map((link, i) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <LinkIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{link}</span>
                          </a>
                        ))}
                    </div>
                  </motion.div>

                  {/* Skills card */}
                  {details.skills.length > 0 && (
                    <motion.div
                      className="glass p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <h4 className="font-bold text-white flex items-center gap-2 mb-4">
                        <Cpu className="w-5 h-5 text-cyan-400" />
                        Technical Skills
                        <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full">
                          {details.skills.length}
                        </span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {details.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/15 rounded-lg text-xs text-cyan-300 font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Regenerate CTA */}
                  <motion.div
                    className="glass-strong p-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Wand2 className="w-5 h-5 text-purple-400" />
                      <h4 className="font-bold text-white">AI Regeneration</h4>
                    </div>
                    <p className="text-white/40 text-xs mb-4">
                      Let AI fix all defects and apply recommendations to generate an improved, ATS-optimized resume.
                    </p>
                    {isLoggedIn() ? (
                      <button
                        onClick={handleRegenerate}
                        disabled={regenStep !== "idle"}
                        className="btn-glow w-full py-3 flex items-center justify-center gap-2 text-sm"
                      >
                        {regenStep === "loading-questions" || regenStep === "regenerating" ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {regenStep === "loading-questions" ? "Preparing..." : "Generating..."}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Regenerate Resume
                          </>
                        )}
                      </button>
                    ) : (
                      <a
                        href="/auth/login"
                        className="btn-ghost w-full py-3 flex items-center justify-center gap-2 text-sm"
                      >
                        <LogIn className="w-4 h-4" />
                        Login to Regenerate
                      </a>
                    )}
                  </motion.div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Defects */}
                  <motion.div
                    className="glass p-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <h4 className="font-bold mb-5 text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Defects Found
                      {analysis.defects?.length > 0 && (
                        <span className="ml-auto text-xs bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full">
                          {analysis.defects.length} issues
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(analysis.defects || []).map((d, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-sm text-white/70 flex gap-3"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                          {d}
                        </motion.div>
                      ))}
                      {(!analysis.defects || analysis.defects.length === 0) && (
                        <p className="text-sm text-white/30 col-span-2">
                          No defects detected — your resume looks clean!
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Recommendations */}
                  <motion.div
                    className="glass-strong p-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <h4 className="font-bold mb-5 text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Recommendations
                      {analysis.recommendations?.length > 0 && (
                        <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full">
                          {analysis.recommendations.length} tips
                        </span>
                      )}
                    </h4>
                    <div className="space-y-3">
                      {(analysis.recommendations || []).map((r, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-sm text-white/70 flex gap-3"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                          {r}
                        </motion.div>
                      ))}
                      {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                        <p className="text-sm text-white/30">
                          No additional recommendations — nice work!
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Clarifying Questions */}
                  {regenStep === "questions" && questions.length > 0 && (
                    <motion.div
                      ref={questionsRef}
                      className="glass-strong p-6 border border-purple-500/20"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Wand2 className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">A few quick questions</h4>
                          <p className="text-white/40 text-xs">Help us fill in the gaps to create a better resume</p>
                        </div>
                      </div>

                      <div className="space-y-4 mt-6">
                        {questions.map((q, i) => (
                          <motion.div
                            key={q.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <label className="text-sm text-white/70 mb-1.5 block">
                              {i + 1}. {q.question}
                            </label>
                            {q.type === "textarea" ? (
                              <textarea
                                className="input-glass min-h-[70px] resize-y"
                                placeholder={q.placeholder}
                                value={answers[q.id] || ""}
                                onChange={(e) =>
                                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                }
                              />
                            ) : (
                              <input
                                type={q.type === "url" ? "url" : "text"}
                                className="input-glass"
                                placeholder={q.placeholder}
                                value={answers[q.id] || ""}
                                onChange={(e) =>
                                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                }
                              />
                            )}
                          </motion.div>
                        ))}
                      </div>

                      {regenError && (
                        <p className="text-red-400 text-sm mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                          {regenError}
                        </p>
                      )}

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => {
                            setRegenStep("idle");
                            setQuestions([]);
                            setAnswers({});
                          }}
                          className="btn-ghost px-5 py-3 text-sm flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitAnswers}
                          disabled={submitting}
                          className="btn-glow px-5 py-3 text-sm flex-1 flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Generate Improved Resume
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-8 text-center text-white/20 text-sm">
        &copy; 2026 Archer Infotech. Built for the next generation of engineers.
      </footer>
    </div>
  );
}
