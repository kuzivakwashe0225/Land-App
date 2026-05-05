import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return !!(
    process.env.FIREBASE_API_KEY &&
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_STORAGE_BUCKET &&
    process.env.FIREBASE_API_KEY !== 'your-api-key' &&
    process.env.FIREBASE_PROJECT_ID !== 'landsolutions'
  );
};

// Local uploads directory
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../uploads');

const ensureUploadDir = (subPath) => {
  const dir = path.join(LOCAL_UPLOADS_DIR, subPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Upload file — uses local storage since Firebase is not configured
export const uploadToFirebase = async (file, storagePath) => {
  if (!file) throw new Error('No file provided to upload function');
  if (!file.path) {
    console.error('Multer file object missing path:', file);
    throw new Error('Internal upload error: file path missing');
  }

  try {
    if (isFirebaseConfigured()) {
      console.log('🚀 Uploading to Firebase:', storagePath);
      // Dynamic import so the app doesn't crash when Firebase isn't configured
      const { initializeApp } = await import('firebase/app');
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

      const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
      };

      const app = initializeApp(firebaseConfig, `app-${Date.now()}`);
      const storage = getStorage(app);
      const storageRef = ref(storage, storagePath);
      const fileBuffer = fs.readFileSync(file.path);
      await uploadBytes(storageRef, fileBuffer);
      const downloadURL = await getDownloadURL(storageRef);

      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) { console.warn('Failed to delete temp file:', e.message); }
      }
      return downloadURL;
    }

    // ── Fallback: Save locally ──────────────────────────────────────────────
    console.log('📂 Saving file locally. Temp path:', file.path);
    const pathParts = storagePath.split('/');
    const subDir = pathParts.slice(0, -1).join('/');
    const cleanFilename = pathParts[pathParts.length - 1].replace(/[^a-zA-Z0-9.\-_]/g, '');
    const filename = `${cleanFilename}-${Date.now()}${path.extname(file.originalname || '.bin')}`;

    const uploadDir = ensureUploadDir(subDir);
    const destPath = path.join(uploadDir, filename);

    console.log('📍 Destination path:', destPath);

    // Move from multer temp location to permanent location
    if (fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, destPath);
      try { fs.unlinkSync(file.path); } catch (e) { console.warn('Cleanup failed:', e.message); }
    } else {
      throw new Error(`Temporary file not found at ${file.path}`);
    }

    // Return a local URL path
    const relativePath = `/uploads/${subDir}/${filename}`;
    console.log(`✅ File saved successfully: ${relativePath}`);
    return relativePath;

  } catch (error) {
    console.error('CRITICAL: Error in uploadToFirebase:', error);

    // Clean up temp file
    if (file && file.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (_) {}
    }

    throw new Error(`Failed to save file: ${error.message}`);
  }
};

// Upload multiple files
export const uploadMultipleToFirebase = async (files, basepath) => {
  const uploadPromises = files.map((file, index) => {
    const filePath = `${basepath}/file-${index}-${Date.now()}`;
    return uploadToFirebase(file, filePath);
  });
  return Promise.all(uploadPromises);
};

// Delete file
export const deleteFromFirebase = async (filePath) => {
  try {
    if (filePath.startsWith('/uploads/')) {
      // Local file
      const localPath = path.join(LOCAL_UPLOADS_DIR, filePath.replace('/uploads/', ''));
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }
    // If Firebase is configured, also try to delete from there
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
