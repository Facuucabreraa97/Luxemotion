
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load usage of .env if available locally, otherwise rely on process.env 
// (Note: in this environment I might need to rely on the user having .env or system envs)
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase Credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'generated-assets';

async function checkAndSetupBucket() {
  console.log(`Checking bucket: ${BUCKET_NAME}...`);
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error("❌ Error listing buckets:", error.message);
    process.exit(1);
  }

  const bucketExists = buckets.find(b => b.name === BUCKET_NAME);

  if (bucketExists) {
    console.log(`✅ Bucket '${BUCKET_NAME}' exists.`);
  } else {
    console.log(`⚠️ Bucket '${BUCKET_NAME}' does not exist. Attempting to create...`);
    const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB (adjust as needed for videos)
      allowedMimeTypes: ['image/png', 'image/jpeg', 'video/mp4', 'video/mpeg']
    });
    
    if (createError) {
      console.error("❌ Failed to create bucket:", createError.message);
      process.exit(1);
    }
    console.log(`✅ Bucket '${BUCKET_NAME}' created successfully.`);
  }

  // update bucket to be public if it wasn't
  if (bucketExists && !bucketExists.public) {
      console.log("Updating bucket to be public...");
      await supabase.storage.updateBucket(BUCKET_NAME, { public: true });
  }

  // Check policies (simplified: try to upload)
  console.log("Testing upload permissions...");
  const testFileName = `test_${Date.now()}.txt`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(testFileName, 'Test content', {
      contentType: 'text/plain',
      upsert: true
    });

  if (uploadError) {
    console.error("❌ Upload test failed:", uploadError.message);
    console.log("👉 You may need to configure RLS policies for the bucket manually in the Supabase Dashboard.");
  } else {
    console.log("✅ Upload test successful.");
    // Cleanup
    await supabase.storage.from(BUCKET_NAME).remove([testFileName]);
  }
}

checkAndSetupBucket();
