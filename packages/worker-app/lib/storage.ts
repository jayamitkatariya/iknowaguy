import { supabase } from "./supabase";

/**
 * Upload evidence file to Supabase Storage 'evidence' bucket.
 *
 * @param file - The file to upload (image, document, etc.)
 * @param bountyId - The bounty ID to scope the file path
 * @returns Public URL of the uploaded file
 */
export async function uploadEvidence(file: File, bountyId: string): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${bountyId}/${timestamp}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("evidence")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[uploadEvidence] Upload failed:", uploadError.message);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from("evidence").getPublicUrl(path);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Failed to retrieve public URL for uploaded file");
  }

  return publicUrlData.publicUrl;
}
