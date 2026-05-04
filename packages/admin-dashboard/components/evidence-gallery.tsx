"use client";

import { useState } from "react";

interface EvidenceGalleryProps {
  mediaUrls: string[];
}

export default function EvidenceGallery({ mediaUrls }: EvidenceGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!mediaUrls || mediaUrls.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>No evidence attached.</p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {mediaUrls.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            style={{
              padding: 0,
              border: "1px solid #374151",
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              background: "none",
            }}
          >
            <img
              src={url}
              alt={`Evidence ${i + 1}`}
              style={{ width: 120, height: 120, objectFit: "cover", display: "block" }}
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
          >
            <img
              src={mediaUrls[lightboxIndex]}
              alt={`Evidence ${lightboxIndex + 1}`}
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 8, display: "block" }}
            />
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
              <button
                onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                disabled={lightboxIndex === 0}
                style={{
                  background: "#1f2937",
                  color: "#f9fafb",
                  border: "1px solid #374151",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 13,
                  cursor: lightboxIndex === 0 ? "not-allowed" : "pointer",
                  opacity: lightboxIndex === 0 ? 0.5 : 1,
                }}
              >
                ← Prev
              </button>
              <span style={{ color: "#d1d5db", fontSize: 13, alignSelf: "center" }}>
                {lightboxIndex + 1} / {mediaUrls.length}
              </span>
              <button
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null && prev < mediaUrls.length - 1 ? prev + 1 : prev
                  )
                }
                disabled={lightboxIndex === mediaUrls.length - 1}
                style={{
                  background: "#1f2937",
                  color: "#f9fafb",
                  border: "1px solid #374151",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 13,
                  cursor: lightboxIndex === mediaUrls.length - 1 ? "not-allowed" : "pointer",
                  opacity: lightboxIndex === mediaUrls.length - 1 ? 0.5 : 1,
                }}
              >
                Next →
              </button>
            </div>
            <button
              onClick={() => setLightboxIndex(null)}
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#ef4444",
                color: "white",
                border: "none",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
