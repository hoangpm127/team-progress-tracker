"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { KrDocument } from "@/lib/types";
import {
  fetchKrDocuments,
  dbUploadKrDocument,
  dbDeleteKrDocument,
  getKrDocumentUrl,
} from "@/lib/db";

/* ── Constants ───────────────────────────────────────────── */

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const ACCEPT_STRING = ".pdf,.png,.jpg,.jpeg";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/* ── Helpers ─────────────────────────────────────────────── */

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function isImage(fileName: string): boolean {
  return /\.(png|jpe?g)$/i.test(fileName);
}

/* ── Lightbox (fullscreen viewer) ────────────────────────── */

function Lightbox({ doc, onClose }: { doc: KrDocument; onClose: () => void }) {
  const url = getKrDocumentUrl(doc.filePath);
  const image = isImage(doc.fileName);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Close button */}
      <button onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {/* Open in new tab */}
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="absolute top-4 right-16 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
        title="Mở trong tab mới">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
      </a>
      {/* Content */}
      {image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt={doc.fileName}
          className="max-w-[92vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
      ) : (
        <iframe src={url} title={doc.fileName}
          className="w-[92vw] h-[90vh] rounded-lg shadow-2xl bg-white" />
      )}
      {/* File name strip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-2 rounded-full max-w-[80vw] truncate">
        {doc.fileName}
      </div>
    </div>
  );
}

/* ── Thumbnail for images ────────────────────────────────── */

function DocThumb({ doc }: { doc: KrDocument }) {
  const url = getKrDocumentUrl(doc.filePath);
  if (isImage(doc.fileName)) {
    return (
      <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white/50">
        <path d="M7 2h7l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.5" />
        <text x="7" y="17" fontSize="5.5" fontWeight="bold" fill="currentColor">PDF</text>
      </svg>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */

export default function KrDocuments({
  krId,
  krTitle,
  onClose,
}: {
  krId: string;
  krTitle: string;
  onClose: () => void;
}) {
  const [docs, setDocs] = useState<KrDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<KrDocument | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents on mount / krId change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchKrDocuments(krId).then((data) => {
      if (!cancelled) { setDocs(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [krId]);

  /* ── Validate & upload a single file ──────────────────────── */
  const uploadFile = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Chỉ cho phép PDF, PNG hoặc JPG.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Dung lượng file tối đa 10 MB.");
      return;
    }
    setError(null);
    setUploading(true);
    const doc = await dbUploadKrDocument(krId, file);
    setUploading(false);
    if (doc) {
      setDocs((prev) => [doc, ...prev]);
    } else {
      setError("Upload thất bại. Vui lòng thử lại.");
    }
  }, [krId]);

  /* ── File input handler ──────────────────────────────────── */
  async function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ── Drag-and-drop handlers ──────────────────────────────── */
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true); }
  function handleDragLeave() { setDragOver(false); }
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  }

  /* ── Delete handler ──────────────────────────────────────── */
  async function handleDelete(doc: KrDocument) {
    setConfirmDeleteId(null);
    await dbDeleteKrDocument(doc);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  }

  return (
    <>
      {/* Lightbox viewer */}
      {viewDoc && <Lightbox doc={viewDoc} onClose={() => setViewDoc(null)} />}

      {/* Main modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white/60">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800">Tài liệu chứng minh</h3>
              <p className="text-xs text-slate-400 truncate">{krTitle}</p>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Upload area (click + drag-drop) */}
          <div className="px-5 pt-4 pb-2">
            <input ref={fileInputRef} type="file" accept={ACCEPT_STRING}
              className="hidden" onChange={handleInputChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              disabled={uploading}
              className={`w-full border-2 border-dashed rounded-xl py-4 flex flex-col items-center gap-1.5 transition
                disabled:opacity-50 disabled:cursor-not-allowed
                ${dragOver
                  ? "border-white/40 bg-white/10 text-white/80"
                  : "border-white/15 hover:border-white/30 text-white/50 hover:text-white/70 hover:bg-white/5"
                }`}
            >
              {uploading ? (
                <>
                  <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                  </svg>
                  <span className="text-xs font-semibold">Đang tải lên...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-semibold">Tải lên PDF, PNG hoặc JPG</span>
                  <span className="text-[10px] text-slate-400">Kéo thả hoặc nhấn để chọn &middot; Tối đa 10 MB</span>
                </>
              )}
            </button>
            {error && (
              <p className="mt-2 text-xs text-white/50 flex items-center gap-1">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Document list */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <svg className="w-5 h-5 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                </svg>
                <span className="text-sm">Đang tải...</span>
              </div>
            ) : docs.length === 0 ? (
              <div className="text-center py-8">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 mx-auto text-slate-200 mb-2">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-slate-400">Chưa có tài liệu nào</p>
                <p className="text-xs text-slate-300 mt-1">Tải lên PDF hoặc ảnh để chứng minh tiến độ</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                {docs.map((doc) => (
                  <div key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition group">
                    {/* Thumbnail / icon */}
                    <DocThumb doc={doc} />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{doc.fileName}</p>
                      <p className="text-[11px] text-slate-400">
                        {fmtSize(doc.fileSize)} &middot; {fmtDate(doc.uploadedAt)}
                        {isImage(doc.fileName)
                          ? <span className="ml-1.5 text-white/60 font-medium">Ảnh</span>
                          : <span className="ml-1.5 text-white/40 font-medium">PDF</span>}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* View / enlarge */}
                      <button onClick={() => setViewDoc(doc)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition"
                        title={isImage(doc.fileName) ? "Mở to ảnh" : "Xem PDF"}>
                        {isImage(doc.fileName) ? (
                          /* Expand icon for images */
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M3 8V4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0zM12 3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V5h-3a1 1 0 010-2zM3 12a1 1 0 012 0v3h3a1 1 0 010 2H4a1 1 0 01-1-1v-4zM16 12a1 1 0 01-1 1h-3a1 1 0 010-2h3v-3a1 1 0 012 0v4z" />
                          </svg>
                        ) : (
                          /* Eye icon for PDFs */
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      {/* Delete */}
                      {confirmDeleteId === doc.id ? (
                        <>
                          <button onClick={() => handleDelete(doc)}
                            className="text-[10px] bg-white/20 text-white px-2 py-1 rounded-lg hover:bg-white/30 font-semibold">Xóa</button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 px-1">✕</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/50 transition opacity-0 group-hover:opacity-100"
                          title="Xóa tài liệu">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">{docs.length} tài liệu</span>
            <button onClick={onClose}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium transition">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
