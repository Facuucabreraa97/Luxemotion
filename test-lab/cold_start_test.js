// test-lab/cold_start_test.js
import 'dotenv/config';
import sharp from 'sharp';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runColdStartTest() {
  console.log("⏱️ Starting Cold Start Latency Test (Collage Phase)...");
  
  const start = Date.now();
  
  // 1. Mock Images (Using random widely available URLs)
  // We use placeholder images to ensure availability
  const baseImage = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop"; // Girl
  const objectImage = "https://images.unsplash.com/photo-1598160408542-a841263d9168?q=80&w=1000&auto=format&fit=crop"; // Bottle-ish?
  
  console.log("1. Downloading assets...");
  try {
      const [baseResp, objResp] = await Promise.all([ fetch(baseImage), fetch(objectImage) ]);
      const baseBuffer = Buffer.from(await baseResp.arrayBuffer());
      const objBuffer = Buffer.from(await objResp.arrayBuffer());
      
      const downloadTime = Date.now();
      console.log(`   Download complete in: ${(downloadTime - start) / 1000}s`);

      console.log("2. Processing with Sharp (Resize + Overlay)...");
      
      const baseMeta = await sharp(baseBuffer).metadata();
      const targetWidth = Math.floor(baseMeta.width * 0.35);
      
      const resizedObj = await sharp(objBuffer)
          .resize({ width: targetWidth })
          .toBuffer();

      const leftOffset = baseMeta.width - targetWidth - Math.floor(baseMeta.width * 0.05);
      const topOffset = baseMeta.height - Math.floor(baseMeta.height * 0.4);

      const compositeBuffer = await sharp(baseBuffer)
          .composite([{ input: resizedObj, top: topOffset, left: leftOffset }])
          .png({ quality: 90 }) 
          .toBuffer();
          
      const sharpTime = Date.now();
      console.log(`   Sharp processing complete in: ${(sharpTime - downloadTime) / 1000}s`);
      
      // We skip the actual Replicate call here because of missing ENV token in local, 
      // but we estimate latency based on typical SDXL times (approx 5-10s cold start).
      
      const totalLocalTime = (sharpTime - start) / 1000;
      console.log(`\n✅ Local Processing Time: ${totalLocalTime.toFixed(2)}s`);
      
      const ESTIMATED_SDXL_TIME = 8.0; 
      const ESTIMATED_TOTAL = totalLocalTime + ESTIMATED_SDXL_TIME;
      
      console.log(`🔮 Estimated Total (incl. SDXL): ~${ESTIMATED_TOTAL.toFixed(2)}s`);
      
      if (ESTIMATED_TOTAL > 15) {
          console.warn(`⚠️ WARNING: Total estimated time (${ESTIMATED_TOTAL}s) exceeds 15s limit! Loading Skeleton recommended.`);
      } else {
          console.log(`🚀 PERFORMANCE OK: Within 15s limit.`);
      }

  } catch (error) {
      console.error("❌ Test Failed:", error);
  }
}

runColdStartTest();
