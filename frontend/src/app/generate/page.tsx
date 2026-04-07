"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  FileDown,
  Plus,
  Trash2,
  Eye,
  Palette,
  Briefcase,
  GraduationCap,
  Code,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { getRegeneratedCV } from "@/lib/api";

type Experience = { title: string; company: string; duration: string; description: string };
type Education = { degree: string; institution: string; year: string };
type CVData = {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  summary: string;
  skills: string;
  experience: Experience[];
  education: Education[];
};

const emptyCV: CVData = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  github: "",
  linkedin: "",
  summary: "",
  skills: "",
  experience: [{ title: "", company: "", duration: "", description: "" }],
  education: [{ degree: "", institution: "", year: "" }],
};

const templates = [
  { id: "minimal", label: "Minimal", color: "from-slate-500 to-slate-700" },
  { id: "modern", label: "Modern", color: "from-indigo-500 to-purple-600" },
  { id: "elegant", label: "Elegant", color: "from-emerald-500 to-teal-600" },
];

// A4 at 96 DPI: 794 x 1123 px
const A4_WIDTH = 794;

/** Returns empty string for null, "null", "N/A", "n/a", undefined, etc. */
function clean(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  if (s === "" || s.toLowerCase() === "null" || s.toLowerCase() === "n/a" || s === "undefined" || s === "none") return "";
  return s;
}

export default function GeneratePage() {
  const [cv, setCv] = useState<CVData>({ ...emptyCV });
  const [template, setTemplate] = useState("minimal");
  const [generating, setGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = getRegeneratedCV();
    if (data) {
      const experience = Array.isArray(data.experience)
        ? (data.experience as Record<string, string>[]).map((e) => ({
            title: clean(e.title),
            company: clean(e.company),
            duration: clean(e.duration),
            description: clean(e.description),
          }))
        : [{ title: "", company: "", duration: "", description: "" }];
      const education = Array.isArray(data.education)
        ? (data.education as Record<string, string>[]).map((e) => ({
            degree: clean(e.degree),
            institution: clean(e.institution),
            year: clean(e.year),
          }))
        : [{ degree: "", institution: "", year: "" }];
      setCv({
        name: clean(data.name),
        title: clean(data.title),
        email: clean(data.email),
        phone: clean(data.phone),
        location: clean(data.location),
        github: clean(data.github),
        linkedin: clean(data.linkedin),
        summary: clean(data.summary),
        skills: clean(data.skills),
        experience,
        education,
      });
      setAutoFilled(true);
    }
  }, []);

  const update = (field: keyof CVData, value: unknown) =>
    setCv((prev) => ({ ...prev, [field]: value }));

  const updateExperience = (idx: number, field: keyof Experience, value: string) => {
    const exp = [...cv.experience];
    exp[idx] = { ...exp[idx], [field]: value };
    update("experience", exp);
  };

  const updateEducation = (idx: number, field: keyof Education, value: string) => {
    const edu = [...cv.education];
    edu[idx] = { ...edu[idx], [field]: value };
    update("education", edu);
  };

  const addExperience = () =>
    update("experience", [...cv.experience, { title: "", company: "", duration: "", description: "" }]);

  const removeExperience = (idx: number) =>
    update("experience", cv.experience.filter((_, i) => i !== idx));

  const addEducation = () =>
    update("education", [...cv.education, { degree: "", institution: "", year: "" }]);

  const removeEducation = (idx: number) =>
    update("education", cv.education.filter((_, i) => i !== idx));

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    setGenerating(true);
    setDownloadError(null);

    try {
      const el = previewRef.current;

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: true,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const imgW = pdfW;
      const imgH = (canvas.height * pdfW) / canvas.width;

      // Multi-page support
      let yOffset = 0;
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -yOffset, imgW, imgH);
        yOffset += pdfH;
      }

      pdf.save(`${cv.name || "resume"}-smart-cv.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadError("PDF download failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const skillsList = cv.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 md:px-8 py-8 max-w-[1400px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">CV Generator</h1>
              <p className="text-white/40 text-sm mt-1">
                Fill in your details, pick a template, and download as PDF
              </p>
              {autoFilled && (
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                  <Sparkles className="w-3 h-3" />
                  Auto-filled from AI regeneration — review and download!
                </div>
              )}
              {downloadError && (
                <div className="mt-2 text-red-400 text-xs">{downloadError}</div>
              )}
            </div>
            <button
              onClick={downloadPDF}
              disabled={generating || !cv.name}
              className="btn-glow px-6 py-3 flex items-center gap-2 text-sm"
            >
              {generating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              Download PDF
            </button>
          </div>

          {/* Template selector */}
          <div className="flex gap-3 mb-8">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  template === t.id
                    ? "glass-strong text-white border border-white/20"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${t.color}`} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              <div className="glass p-6 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="input-glass" placeholder="Full Name" value={cv.name} onChange={(e) => update("name", e.target.value)} />
                  <input className="input-glass" placeholder="Job Title" value={cv.title} onChange={(e) => update("title", e.target.value)} />
                  <input className="input-glass" placeholder="Email" value={cv.email} onChange={(e) => update("email", e.target.value)} />
                  <input className="input-glass" placeholder="Phone" value={cv.phone} onChange={(e) => update("phone", e.target.value)} />
                  <input className="input-glass" placeholder="Location" value={cv.location} onChange={(e) => update("location", e.target.value)} />
                  <input className="input-glass" placeholder="GitHub URL" value={cv.github} onChange={(e) => update("github", e.target.value)} />
                  <input className="input-glass sm:col-span-2" placeholder="LinkedIn URL" value={cv.linkedin} onChange={(e) => update("linkedin", e.target.value)} />
                </div>
              </div>

              <div className="glass p-6 space-y-4">
                <h3 className="font-bold text-white">Professional Summary</h3>
                <textarea
                  className="input-glass min-h-[80px] resize-y"
                  placeholder="Brief summary of your professional background..."
                  value={cv.summary}
                  onChange={(e) => update("summary", e.target.value)}
                />
              </div>

              <div className="glass p-6 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  Skills
                </h3>
                <input
                  className="input-glass"
                  placeholder="Comma-separated: React, Python, FastAPI, ..."
                  value={cv.skills}
                  onChange={(e) => update("skills", e.target.value)}
                />
              </div>

              <div className="glass p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    Experience
                  </h3>
                  <button onClick={addExperience} className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {cv.experience.map((exp, i) => (
                  <div key={i} className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/30">Experience {i + 1}</span>
                      {cv.experience.length > 1 && (
                        <button onClick={() => removeExperience(i)} className="text-red-400/60 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input className="input-glass" placeholder="Job Title" value={exp.title} onChange={(e) => updateExperience(i, "title", e.target.value)} />
                      <input className="input-glass" placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} />
                      <input className="input-glass sm:col-span-2" placeholder="Duration (e.g. Jan 2024 - Present)" value={exp.duration} onChange={(e) => updateExperience(i, "duration", e.target.value)} />
                    </div>
                    <textarea
                      className="input-glass min-h-[60px] resize-y"
                      placeholder="Key responsibilities and achievements..."
                      value={exp.description}
                      onChange={(e) => updateExperience(i, "description", e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="glass p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                    Education
                  </h3>
                  <button onClick={addEducation} className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {cv.education.map((edu, i) => (
                  <div key={i} className="space-y-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/30">Education {i + 1}</span>
                      {cv.education.length > 1 && (
                        <button onClick={() => removeEducation(i)} className="text-red-400/60 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input className="input-glass" placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} />
                      <input className="input-glass" placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} />
                      <input className="input-glass" placeholder="Year" value={edu.year} onChange={(e) => updateEducation(i, "year", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Eye className="w-4 h-4" />
                Live Preview (A4)
              </div>
              <div className="glass p-4 overflow-auto max-h-[85vh] sticky top-24">
                <div
                  ref={previewRef}
                  style={{
                    width: `${A4_WIDTH}px`,
                    minHeight: "1123px",
                    background: "#ffffff",
                    color: "#1a1a1a",
                    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    letterSpacing: "0.01em",
                    transform: "scale(0.62)",
                    transformOrigin: "top left",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  {template === "minimal" && <MinimalTemplate cv={cv} skills={skillsList} />}
                  {template === "modern" && <ModernTemplate cv={cv} skills={skillsList} />}
                  {template === "elegant" && <ElegantTemplate cv={cv} skills={skillsList} />}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE: Minimal — Clean, professional, ATS-friendly
   Uses ONLY inline styles — no SVG icons, no Tailwind
   ═══════════════════════════════════════════════════════════════ */
function MinimalTemplate({ cv, skills }: { cv: CVData; skills: string[] }) {
  const section: React.CSSProperties = { marginBottom: "22px" };
  const sectionTitle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: "#6b7280",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "6px",
    marginBottom: "12px",
  };
  const jobTitle: React.CSSProperties = { fontWeight: 600, fontSize: "14px", color: "#111827" };
  const meta: React.CSSProperties = { fontSize: "12px", color: "#9ca3af" };
  const body: React.CSSProperties = { fontSize: "13px", color: "#4b5563", lineHeight: "1.65", marginTop: "4px" };

  return (
    <div style={{ padding: "48px 52px", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.5px" }}>
          {cv.name || "Your Name"}
        </h1>
        <p style={{ fontSize: "15px", color: "#6b7280", margin: "4px 0 0 0" }}>{cv.title || "Job Title"}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "10px", flexWrap: "wrap", fontSize: "12px", color: "#9ca3af" }}>
          {cv.email && <span>{cv.email}</span>}
          {cv.phone && <span>|&nbsp;&nbsp;{cv.phone}</span>}
          {cv.location && <span>|&nbsp;&nbsp;{cv.location}</span>}
        </div>
        {(cv.github || cv.linkedin) && (
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "4px", fontSize: "12px", color: "#9ca3af" }}>
            {cv.github && <span>{cv.github}</span>}
            {cv.linkedin && <span>{cv.linkedin}</span>}
          </div>
        )}
      </div>

      <div style={{ borderTop: "2px solid #111827", marginBottom: "24px" }} />

      {cv.summary && (
        <div style={section}>
          <h2 style={sectionTitle}>Professional Summary</h2>
          <p style={body}>{cv.summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div style={section}>
          <h2 style={sectionTitle}>Technical Skills</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {skills.map((s, i) => (
              <span key={i} style={{ padding: "4px 12px", background: "#f3f4f6", color: "#374151", borderRadius: "4px", fontSize: "12px", fontWeight: 500 }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {cv.experience.some((e) => e.title) && (
        <div style={section}>
          <h2 style={sectionTitle}>Experience</h2>
          {cv.experience.filter((e) => e.title).map((exp, i) => (
            <div key={i} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={jobTitle}>{exp.title}</span>
                <span style={meta}>{exp.duration}</span>
              </div>
              <p style={{ fontSize: "13px", color: "#6366f1", fontWeight: 500, margin: "2px 0 0 0" }}>{exp.company}</p>
              {exp.description && <p style={body}>{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {cv.education.some((e) => e.degree) && (
        <div style={section}>
          <h2 style={sectionTitle}>Education</h2>
          {cv.education.filter((e) => e.degree).map((edu, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={jobTitle}>{edu.degree}</span>
                <span style={meta}>{edu.year}</span>
              </div>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0 0" }}>{edu.institution}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE: Modern — Bold header with accent color
   ═══════════════════════════════════════════════════════════════ */
function ModernTemplate({ cv, skills }: { cv: CVData; skills: string[] }) {
  const accent = "#4f46e5";
  const sectionTitle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: accent,
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
  const bar: React.CSSProperties = { width: "4px", height: "16px", background: accent, borderRadius: "2px", flexShrink: 0 };
  const jobTitle: React.CSSProperties = { fontWeight: 600, fontSize: "14px", color: "#111827" };
  const meta: React.CSSProperties = { fontSize: "12px", color: "#9ca3af" };
  const body: React.CSSProperties = { fontSize: "13px", color: "#4b5563", lineHeight: "1.65", marginTop: "4px" };

  return (
    <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "40px 52px", color: "white" }}>
        <h1 style={{ fontSize: "30px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
          {cv.name || "Your Name"}
        </h1>
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.75)", margin: "4px 0 0 0" }}>{cv.title || "Job Title"}</p>
        <div style={{ display: "flex", gap: "20px", marginTop: "16px", flexWrap: "wrap", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          {cv.email && <span>{cv.email}</span>}
          {cv.phone && <span>{cv.phone}</span>}
          {cv.location && <span>{cv.location}</span>}
          {cv.github && <span>{cv.github}</span>}
          {cv.linkedin && <span>{cv.linkedin}</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "32px 52px" }}>
        {cv.summary && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={sectionTitle}><span style={bar} /> Summary</h2>
            <p style={{ ...body, paddingLeft: "12px" }}>{cv.summary}</p>
          </div>
        )}

        {skills.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={sectionTitle}><span style={bar} /> Skills</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingLeft: "12px" }}>
              {skills.map((s, i) => (
                <span key={i} style={{ padding: "4px 14px", background: "#eef2ff", color: "#4338ca", borderRadius: "20px", fontSize: "12px", fontWeight: 500 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {cv.experience.some((e) => e.title) && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={sectionTitle}><span style={bar} /> Experience</h2>
            {cv.experience.filter((e) => e.title).map((exp, i) => (
              <div key={i} style={{ marginBottom: "16px", paddingLeft: "12px", borderLeft: "2px solid #e0e7ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={jobTitle}>{exp.title}</span>
                  <span style={{ ...meta, flexShrink: 0, marginLeft: "8px" }}>{exp.duration}</span>
                </div>
                <p style={{ fontSize: "13px", color: accent, fontWeight: 500, margin: "2px 0 0 0" }}>{exp.company}</p>
                {exp.description && <p style={body}>{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {cv.education.some((e) => e.degree) && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={sectionTitle}><span style={bar} /> Education</h2>
            {cv.education.filter((e) => e.degree).map((edu, i) => (
              <div key={i} style={{ marginBottom: "10px", paddingLeft: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={jobTitle}>{edu.degree}</span>
                  <span style={meta}>{edu.year}</span>
                </div>
                <p style={{ fontSize: "13px", color: accent, margin: "2px 0 0 0" }}>{edu.institution}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE: Elegant — Sidebar layout with emerald theme
   ═══════════════════════════════════════════════════════════════ */
function ElegantTemplate({ cv, skills }: { cv: CVData; skills: string[] }) {
  const accent = "#047857";
  const sectionTitle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: accent,
    marginBottom: "12px",
  };
  const jobTitle: React.CSSProperties = { fontWeight: 600, fontSize: "14px", color: "#111827" };
  const meta: React.CSSProperties = { fontSize: "12px", color: "#9ca3af" };
  const body: React.CSSProperties = { fontSize: "13px", color: "#4b5563", lineHeight: "1.65", marginTop: "4px" };
  const dot: React.CSSProperties = {
    position: "absolute" as const,
    left: "-6px",
    top: "6px",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: accent,
  };

  return (
    <div style={{ display: "flex", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", minHeight: "1123px" }}>
      {/* Sidebar */}
      <div style={{ width: "280px", background: "linear-gradient(180deg, #047857, #0f766e)", color: "white", padding: "44px 28px", flexShrink: 0 }}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            fontWeight: 700,
            marginBottom: "16px",
          }}>
            {cv.name ? cv.name.charAt(0).toUpperCase() : "?"}
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, lineHeight: "1.3" }}>{cv.name || "Your Name"}</h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "4px 0 0 0" }}>{cv.title || "Job Title"}</p>
        </div>

        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", lineHeight: "2" }}>
          {cv.email && <div style={{ wordBreak: "break-all" as const }}>{cv.email}</div>}
          {cv.phone && <div>{cv.phone}</div>}
          {cv.location && <div>{cv.location}</div>}
          {cv.github && <div style={{ wordBreak: "break-all" as const }}>{cv.github}</div>}
          {cv.linkedin && <div style={{ wordBreak: "break-all" as const }}>{cv.linkedin}</div>}
        </div>

        {skills.length > 0 && (
          <div style={{ marginTop: "32px" }}>
            <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "rgba(255,255,255,0.6)", marginBottom: "12px" }}>
              Skills
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {skills.map((s, i) => (
                <span key={i} style={{ padding: "3px 10px", background: "rgba(255,255,255,0.15)", borderRadius: "4px", fontSize: "11px", color: "rgba(255,255,255,0.9)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "44px 36px" }}>
        {cv.summary && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={sectionTitle}>About Me</h2>
            <p style={body}>{cv.summary}</p>
          </div>
        )}

        {cv.experience.some((e) => e.title) && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={sectionTitle}>Experience</h2>
            {cv.experience.filter((e) => e.title).map((exp, i) => (
              <div key={i} style={{ marginBottom: "16px", position: "relative", paddingLeft: "18px", borderLeft: "2px solid #d1fae5" }}>
                <div style={dot} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={jobTitle}>{exp.title}</span>
                  <span style={{ ...meta, flexShrink: 0, marginLeft: "8px" }}>{exp.duration}</span>
                </div>
                <p style={{ fontSize: "13px", color: accent, fontWeight: 500, margin: "2px 0 0 0" }}>{exp.company}</p>
                {exp.description && <p style={body}>{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {cv.education.some((e) => e.degree) && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={sectionTitle}>Education</h2>
            {cv.education.filter((e) => e.degree).map((edu, i) => (
              <div key={i} style={{ marginBottom: "10px", position: "relative", paddingLeft: "18px", borderLeft: "2px solid #d1fae5" }}>
                <div style={dot} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={jobTitle}>{edu.degree}</span>
                  <span style={meta}>{edu.year}</span>
                </div>
                <p style={{ fontSize: "13px", color: accent, margin: "2px 0 0 0" }}>{edu.institution}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
