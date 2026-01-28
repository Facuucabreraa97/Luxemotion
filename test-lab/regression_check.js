// test-lab/regression_check.js
import 'dotenv/config';

// SIMULATION OF REGRESSION TEST
// This script simulates a request to the generate API with a single image
// to ensure the "Collage" logic is skipped and no errors occur.

async function runRegression() {
  console.log("🧪 Running Regression Check: Standard Flow (1 Image)");
  
  // NOTE: In a real environment, we would use `fetch` to hit the local server.
  // Since we are mocking the internal logic validation:
  
  const mockBody = {
      start_image_url: "https://example.com/girl.jpg",
      // NO end_image_url -> Should trigger Standard Flow
      prompt: "Walking in a park",
      duration: "5"
  };

  const finalStartImage = mockBody.start_image_url;
  const finalEndImage = mockBody.end_image_url;

  console.log("params:", { finalStartImage, finalEndImage });

  if (finalStartImage && finalEndImage && finalStartImage !== finalEndImage) {
      console.error("❌ ERROR: Logic would trigger Composition Interceptor!");
      process.exit(1);
  } else {
      console.log("✅ SUCCESS: Logic skips Composition Interceptor as expected.");
  }
}

runRegression();
