
import { supabase } from '../lib/supabase';

export const StorageService = {
    async uploadFile(file: File, path: string): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('uploads') // Ensure this bucket exists in Supabase
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
        return data.publicUrl;
    }
};
