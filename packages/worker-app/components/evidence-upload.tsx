import { useState } from "react";
import { uploadEvidence } from "@/lib/storage";

interface EvidenceUploadProps {
  bountyId: string;
  onPhotosChange: (photos: string[]) => void;
  photos: string[];
}

export default function EvidenceUpload({ bountyId, onPhotosChange, photos }: EvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const newPhotos = [...photos];
    const total = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          setError(`Skipped ${file.name}: not an image file`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(`Skipped ${file.name}: file too large (max 10MB)`);
          continue;
        }
        const url = await uploadEvidence(file, bountyId);
        newPhotos.push(url);
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }
      onPhotosChange(newPhotos);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        Photos / Evidence
      </label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoChange}
        disabled={uploading}
        style={{
          display: "block",
          width: "100%",
          padding: "10px 12px",
          fontSize: 13,
          color: "#d1d5db",
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 8,
          cursor: uploading ? "not-allowed" : "pointer",
          boxSizing: "border-box",
        }}
      />

      {uploading && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
            Uploading... {uploadProgress}%
          </div>
          <div style={{ width: "100%", height: 6, background: "#374151", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                background: "#6366f1",
                borderRadius: 3,
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>{error}</p>
      )}

      {photos.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {photos.map((url, i) => (
            <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
              <img
                src={url}
                alt={`Evidence ${i + 1}`}
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #374151" }}
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
