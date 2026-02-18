import { supabase } from '../lib/supabase';

// Defense-in-depth: client-side validation (server also enforces via bucket config)
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`);
  }
}

export const StorageService = {
  async uploadFile(file: File, path: string): Promise<string> {
    validateFile(file);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
    return data.publicUrl;
  },

  async uploadGenerationAsset(file: File): Promise<string> {
    validateFile(file);

    const fileExt = file.name.split('.').pop();
    const fileName = `temp_gen_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    // Store in a 'temp' folder if possible, or root of uploads
    const filePath = `studio_temp/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

    if (uploadError) throw uploadError;

    // Use Signed URL for 1 hour to ensure Replicate access
    const { data, error } = await supabase.storage.from('uploads').createSignedUrl(filePath, 3600);

    if (error || !data) throw error || new Error('Failed to sign URL');

    return data.signedUrl;
  },
};
