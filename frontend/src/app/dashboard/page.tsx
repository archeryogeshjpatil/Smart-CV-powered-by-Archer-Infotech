"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Clock,
  TrendingUp,
  Trash2,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getHistory, deleteHistory, verifyAuth, type ResumeHistory } from "@/lib/api";

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [history, setHistory] = useState<ResumeHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const u = await verifyAuth();
      setUser(u);

      if (u) {
        try {
          const data = await getHistory();
          setHistory(data || []);
        } catch {
          // Failed to load history
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteHistory(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch {
      // Failed to delete
    }
  };

  const avgScore =
    history.length > 0
      ? Math.round(history.reduce((sum, h) => sum + h.ats_score, 0) / history.length)
      : 0;

  const bestScore = history.length > 0 ? Math.max(...history.map((h) => h.ats_score)) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-12 text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
            <p className="text-white/40 text-sm mb-6">
              Sign in to view your resume analysis history and track your progress.
            </p>
            <Link href="/auth/login" className="btn-glow inline-flex items-center gap-2 px-6 py-3 text-sm">
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 md:px-8 py-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-indigo-400" />
              Dashboard
            </h1>
            <p className="text-white/40 text-sm mt-1">Your resume analysis history and insights</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="glass p-6 text-center">
              <FileText className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{history.length}</p>
              <p className="text-xs text-white/40 mt-1">Resumes Analyzed</p>
            </div>
            <div className="glass p-6 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-400">{avgScore}%</p>
              <p className="text-xs text-white/40 mt-1">Average ATS Score</p>
            </div>
            <div className="glass p-6 text-center">
              <TrendingUp className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-cyan-400">{bestScore}%</p>
              <p className="text-xs text-white/40 mt-1">Best ATS Score</p>
            </div>
          </div>

          {/* History */}
          {history.length === 0 ? (
            <div className="glass p-12 text-center">
              <FileText className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white/50 mb-2">No resumes analyzed yet</h3>
              <p className="text-white/30 text-sm mb-6">Upload a resume to get started with your first analysis.</p>
              <Link href="/" className="btn-glow inline-flex items-center gap-2 px-6 py-3 text-sm">
                Analyze Resume
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, i) => {
                const scoreColor =
                  entry.ats_score >= 70
                    ? "text-emerald-400"
                    : entry.ats_score >= 40
                      ? "text-amber-400"
                      : "text-red-400";
                const details = (entry.details || {}) as Record<string, unknown>;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-white/30" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{entry.file_name}</h4>
                        <p className="text-xs text-white/30 mt-0.5">
                          {(details?.name as string) || "Unknown"} &middot;{" "}
                          {entry.analysis?.defects?.length || 0} defects &middot;{" "}
                          {entry.analysis?.recommendations?.length || 0} recommendations
                        </p>
                        <div className="flex items-center gap-1 text-xs text-white/20 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-bold ${scoreColor}`}>
                        {entry.ats_score}%
                      </span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-white/20 hover:text-red-400 transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
