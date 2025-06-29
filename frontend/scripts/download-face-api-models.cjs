// Simple script to download face-api.js models
const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

// Use raw content URL that doesn't redirect
const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODELS_DIR = path.join(__dirname, '..', 'public', 'face-api-models');

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);
    
    const file = fs.createWriteStream(outputPath);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`Redirecting to: ${response.headers.location}`);
        return downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
      }
      
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
        fs.unlink(outputPath, () => {}); // Delete the file if there's an error
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file if there's an error
      reject(err);
    });
    
    // Add timeout
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });
  });
}

async function ensureDir(dir) {
  try {
    await access(dir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } else {
      throw err;
    }
  }
}

async function downloadModels() {
  try {
    await ensureDir(MODELS_DIR);
    
    // Download one file at a time to avoid rate limiting
    for (const model of models) {
      const url = `${MODEL_URL}/${model}`;
      const outputPath = path.join(MODELS_DIR, model);
      
      try {
        await access(outputPath);
        console.log(`⏩ Skipping ${model} - already exists`);
        continue;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      
      // Add a small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await downloadFile(url, outputPath);
      } catch (error) {
        console.error(`❌ Error downloading ${model}:`, error.message);
        // Continue with next file even if one fails
      }
    }
    
    console.log('✅ All models downloaded successfully!');
  } catch (error) {
    console.error('❌ Error downloading models:', error.message);
    process.exit(1);
  }
}

// Run the download
downloadModels();
