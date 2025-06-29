const fs = require('fs');
const https = require('https');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODELS_DIR = path.join(__dirname, '..', 'public', 'face-api-models');

const modelFiles = [
  'tiny_face_detector_model-weights_manifest.json'
];

async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);
    
    const file = fs.createWriteStream(outputPath);
    
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded ${outputPath}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });
  });
}

async function fixModels() {
  try {
    for (const model of modelFiles) {
      const url = `${MODEL_URL}/${model}`;
      const outputPath = path.join(MODELS_DIR, model);
      
      console.log(`\nFixing ${model}...`);
      await downloadFile(url, outputPath);
      
      // Verify the file is not empty
      const stats = fs.statSync(outputPath);
      if (stats.size === 0) {
        throw new Error(`File ${outputPath} is still empty after download`);
      }
      
      console.log(`✅ Successfully fixed ${model}`);
    }
    
    console.log('\n✅ All models fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing models:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixModels();
