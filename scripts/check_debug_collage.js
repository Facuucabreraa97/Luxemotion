import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDebugImages() {
  console.log("🔍 Checking 'videos' bucket for DEBUG_COLLAGE...");
  
  // List all files in the bucket (recursive-ish, simplified for top level folders)
  // We need to search through user folders.
  // For this script, we'll try to list the top level folders and then search inside.
  
  // Actually, list top level folders first
  const { data: folders, error: folderError } = await supabase.storage.from('videos').list();
  
  if (folderError) {
    console.error("Error listing bucket:", folderError);
    return;
  }
  
  console.log(`Found ${folders.length} top-level items.`);
  
  const debugImages = [];

  for (const folder of folders) {
      if (!folder.id) continue; // Skip if not a folder/file with ID
      
      // Assume folders are userIds. List inside.
      const { data: files, error: fileError } = await supabase.storage.from('videos').list(folder.name, {
          limit: 10,
          sortBy: { column: 'created_at', order: 'desc' }
      });
      
      if (files) {
          for (const file of files) {
              if (file.name.includes('DEBUG_COLLAGE')) {
                  const path = `${folder.name}/${file.name}`;
                  const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(path);
                  debugImages.push({
                      path,
                      created_at: file.created_at,
                      url: publicUrl
                  });
              }
          }
      }
  }
  
  // Sort all found by date descending
  debugImages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  if (debugImages.length > 0) {
      console.log("\n✅ FOUND DEBUG IMAGES:");
      debugImages.forEach(img => {
          console.log(`[${img.created_at}] ${img.url}`);
      });
      console.log("\nCopy the URL above to view the raw collage.");
  } else {
      console.log("\n❌ No 'DEBUG_COLLAGE' images found yet.");
  }
}

checkDebugImages();
