import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import {
  getDb,
  getFolders,
  createFolder,
  deleteFolder,
  getLabels,
  createLabel,
  deleteLabel,
  getAds,
  createAd,
  updateAd,
  deleteAd,
  getStorageInfo,
  MEDIA_DIR,
  BASE_DATA_DIR,
  DB_PATH
} from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  // Body parser
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize SQLite database and directory structures
  await getDb();

  // Configure Multer for local media file storage in SwipefileData/media
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(MEDIA_DIR)) {
        fs.mkdirSync(MEDIA_DIR, { recursive: true });
      }
      cb(null, MEDIA_DIR);
    },
    filename: (req, file, cb) => {
      // Clean filename and prepend timestamp to prevent collisions
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFilename = `${Date.now()}_${baseName}${ext}`;
      cb(null, uniqueFilename);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for ad videos & high-res creatives
  });

  // API Routes
  // 1. Folders
  app.get('/api/folders', async (req, res) => {
    try {
      const folders = await getFolders();
      res.json(folders);
    } catch (err: any) {
      console.error('Error fetching folders:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/folders', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Folder name is required' });
      }
      const folder = await createFolder(name);
      res.status(201).json(folder);
    } catch (err: any) {
      console.error('Error creating folder:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/folders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteFolder(id);
      res.json({ success: true, message: `Folder ${id} deleted` });
    } catch (err: any) {
      console.error('Error deleting folder:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Labels
  app.get('/api/labels', async (req, res) => {
    try {
      const labels = await getLabels();
      res.json(labels);
    } catch (err: any) {
      console.error('Error fetching labels:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/labels', async (req, res) => {
    try {
      const { name, color } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Label name is required' });
      }
      const label = await createLabel(name, color || '#64748b');
      res.status(201).json(label);
    } catch (err: any) {
      console.error('Error creating label:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/labels/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteLabel(id);
      res.json({ success: true, message: `Label ${id} deleted` });
    } catch (err: any) {
      console.error('Error deleting label:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Ads
  app.get('/api/ads', async (req, res) => {
    try {
      const folderId = req.query.folder_id ? parseInt(req.query.folder_id as string, 10) : undefined;
      const labelId = req.query.label_id ? parseInt(req.query.label_id as string, 10) : undefined;
      const search = req.query.search ? (req.query.search as string) : undefined;

      const ads = await getAds({ folderId, labelId, search });
      res.json(ads);
    } catch (err: any) {
      console.error('Error fetching ads:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Phase 3: The Upload Mechanism
  // Copies selected image/video to SwipefileData/media and stores absolute file path in SQLite
  app.post('/api/ads', upload.single('media'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Media file is required' });
      }

      const mediaPath = req.file.path; // Absolute file path on local filesystem
      const advertiserName = req.body.advertiser_name || '';
      const primaryText = req.body.primary_text || req.body.text_copy || '';
      const headline = req.body.headline || '';
      const ctaText = req.body.cta_text || 'See Details';
      const textCopy = req.body.text_copy || `${primaryText}\n\n${headline}`.trim();
      const folderId = req.body.folder_id ? parseInt(req.body.folder_id, 10) : null;
      let labelIds: number[] = [];

      if (req.body.label_ids) {
        try {
          const parsed = typeof req.body.label_ids === 'string'
            ? JSON.parse(req.body.label_ids)
            : req.body.label_ids;
          if (Array.isArray(parsed)) {
            labelIds = parsed.map(Number).filter(n => !isNaN(n));
          }
        } catch {
          // ignore parsing error
        }
      }

      const newAd = await createAd({
        media_path: mediaPath,
        advertiser_name: advertiserName,
        primary_text: primaryText,
        headline: headline,
        cta_text: ctaText,
        text_copy: textCopy,
        folder_id: folderId,
        label_ids: labelIds
      });

      res.status(201).json(newAd);
    } catch (err: any) {
      console.error('Error creating ad:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/ads/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const advertiserName = req.body.advertiser_name;
      const primaryText = req.body.primary_text;
      const headline = req.body.headline;
      const ctaText = req.body.cta_text;
      const textCopy = req.body.text_copy;
      const folderId = req.body.folder_id !== undefined
        ? (req.body.folder_id === null ? null : parseInt(req.body.folder_id, 10))
        : undefined;

      let labelIds: number[] | undefined = undefined;
      if (req.body.label_ids !== undefined) {
        labelIds = Array.isArray(req.body.label_ids) ? req.body.label_ids.map(Number) : [];
      }

      const updated = await updateAd(id, {
        advertiser_name: advertiserName,
        primary_text: primaryText,
        headline: headline,
        cta_text: ctaText,
        text_copy: textCopy,
        folder_id: folderId,
        label_ids: labelIds
      });

      res.json(updated);
    } catch (err: any) {
      console.error('Error updating ad:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/ads/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deleteFile = req.query.delete_file === 'true';
      await deleteAd(id, deleteFile);
      res.json({ success: true, message: `Ad ${id} deleted` });
    } catch (err: any) {
      console.error('Error deleting ad:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Serve media files directly from SwipefileData/media folder
  app.get('/api/media/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(MEDIA_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Media file not found');
    }

    res.sendFile(filePath);
  });

  // 4. System & Storage Info
  app.get('/api/system/info', async (req, res) => {
    try {
      const info = await getStorageInfo();
      res.json(info);
    } catch (err: any) {
      console.error('Error getting system info:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite integration
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Swipefile] Server running at http://localhost:${PORT}`);
    console.log(`[Swipefile] SQLite database at: ${DB_PATH}`);
    console.log(`[Swipefile] Media storage at: ${MEDIA_DIR}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Swipefile server:', err);
  process.exit(1);
});
