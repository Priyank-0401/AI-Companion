// check-firestore.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the service account file
const serviceAccountPath = resolve(__dirname, 'C:/Users/priya/Downloads/ai-companion-agent-firebase-adminsdk-fbsvc-b041c5d17a.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listCollections() {
  console.log('Listing all collections:');
  const collections = await db.listCollections();
  collections.forEach(collection => {
    console.log(`- ${collection.id}`);
  });
}

async function listConversations() {
  console.log('\nListing all conversations:');
  const snapshot = await db.collection('conversations').get();
  snapshot.forEach(doc => {
    console.log(`\nConversation ID: ${doc.id}`);
    console.log(doc.data());
  });
}

// Run the functions
async function main() {
  try {
    await listCollections();
    await listConversations();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main();