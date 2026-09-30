import fs from 'fs';
import path from 'path';
import os from 'os';
import initSqlJs, { Database } from 'sql.js';

export interface Folder {
  id: number;
  name: string;
  ad_count?: number;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  ad_count?: number;
}

export interface Ad {
  id: number;
  media_path: string;
  media_filename: string;
  advertiser_name: string;
  primary_text: string;     // Facebook Ad description/body text (above media)
  headline: string;         // Facebook Ad headline (below media)
  cta_text: string;         // Facebook Ad CTA button text (e.g. "See Details")
  text_copy: string;        // Combined copy for fallback/search
  folder_id: number | null;
  folder_name?: string | null;
  created_at: string;
  labels: Label[];
}

export interface StorageInfo {
  baseDir: string;
  mediaDir: string;
  dbPath: string;
  totalAds: number;
  totalFolders: number;
  totalLabels: number;
  storageSizeBytes: number;
}

// Local filesystem paths per architecture constraints
const USER_HOME = os.homedir();
export const BASE_DATA_DIR = path.join(USER_HOME, 'SwipefileData');
export const MEDIA_DIR = path.join(BASE_DATA_DIR, 'media');
export const DB_PATH = path.join(BASE_DATA_DIR, 'swipefile.db');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure directories exist
  if (!fs.existsSync(BASE_DATA_DIR)) {
    fs.mkdirSync(BASE_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing SQLite file if present, else create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  migrateSchema(dbInstance);
  seedInitialData(dbInstance);
  saveDb(dbInstance);

  return dbInstance;
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_path TEXT NOT NULL,
      advertiser_name TEXT,
      primary_text TEXT,
      headline TEXT,
      cta_text TEXT DEFAULT 'See Details',
      text_copy TEXT,
      folder_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ad_labels (
      ad_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      PRIMARY KEY (ad_id, label_id),
      FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    );
  `);
}

function migrateSchema(db: Database): void {
  // Ensure new Facebook Ads Library columns exist
  try {
    const tableInfo = db.exec("PRAGMA table_info(ads)");
    if (tableInfo.length > 0 && tableInfo[0].values) {
      const existingColumns = tableInfo[0].values.map((col: any) => col[1] as string);
      
      if (!existingColumns.includes('advertiser_name')) {
        db.run("ALTER TABLE ads ADD COLUMN advertiser_name TEXT");
      }
      if (!existingColumns.includes('primary_text')) {
        db.run("ALTER TABLE ads ADD COLUMN primary_text TEXT");
      }
      if (!existingColumns.includes('headline')) {
        db.run("ALTER TABLE ads ADD COLUMN headline TEXT");
      }
      if (!existingColumns.includes('cta_text')) {
        db.run("ALTER TABLE ads ADD COLUMN cta_text TEXT DEFAULT 'See Details'");
      }

      // Backfill any empty primary_text or headline from text_copy
      db.run(`
        UPDATE ads 
        SET primary_text = text_copy 
        WHERE (primary_text IS NULL OR primary_text = '') AND text_copy IS NOT NULL
      `);
      db.run(`
        UPDATE ads 
        SET headline = 'Learn More' 
        WHERE (headline IS NULL OR headline = '')
      `);
      db.run(`
        UPDATE ads 
        SET cta_text = 'See Details' 
        WHERE (cta_text IS NULL OR cta_text = '')
      `);
      db.run(`
        UPDATE ads 
        SET advertiser_name = (
          SELECT name FROM folders WHERE folders.id = ads.folder_id
        )
        WHERE advertiser_name IS NULL OR advertiser_name = ''
      `);
    }
  } catch (err) {
    console.warn('Migration warning:', err);
  }
}

export function saveDb(db?: Database): void {
  const targetDb = db || dbInstance;
  if (!targetDb) return;
  try {
    const data = targetDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database file to disk:', err);
  }
}

function seedInitialData(db: Database): void {
  // Check if folders already populated
  const folderRes = db.exec("SELECT COUNT(*) as count FROM folders");
  const folderCount = folderRes.length > 0 ? (folderRes[0].values[0][0] as number) : 0;

  if (folderCount === 0) {
    const seedFolders = [
      "Tree Service Lead Gen",
      "SEO Campaigns",
      "Web Design Inspiration",
      "B2B SaaS"
    ];

    const stmt = db.prepare("INSERT INTO folders (name) VALUES (?)");
    for (const folder of seedFolders) {
      stmt.run([folder]);
    }
    stmt.free();
  }

  // Check if labels already populated
  const labelRes = db.exec("SELECT COUNT(*) as count FROM labels");
  const labelCount = labelRes.length > 0 ? (labelRes[0].values[0][0] as number) : 0;

  if (labelCount === 0) {
    const seedLabels = [
      { name: "Carousel", color: "#38bdf8" },        // Sky blue
      { name: "Video Hook", color: "#f43f5e" },      // Rose red
      { name: "Direct Response", color: "#10b981" }, // Emerald green
      { name: "HighLevel", color: "#fbbf24" }        // Amber
    ];

    const stmt = db.prepare("INSERT INTO labels (name, color) VALUES (?, ?)");
    for (const label of seedLabels) {
      stmt.run([label.name, label.color]);
    }
    stmt.free();
  }

  // Seed sample ad creatives if ads table is empty
  const adsRes = db.exec("SELECT COUNT(*) as count FROM ads");
  const adsCount = adsRes.length > 0 ? (adsRes[0].values[0][0] as number) : 0;

  if (adsCount === 0) {
    const workspaceRoot = process.cwd();
    const sampleImages = [
      {
        srcFile: path.join(workspaceRoot, 'src/assets/images/tree_service_ad_1790776825210.jpg'),
        destFilename: 'tree_service_lead_ad.jpg',
        folderName: 'Tree Service Lead Gen',
        advertiserName: 'TimberShield Tree Experts',
        headline: "Free 15-Minute On-Site Estimates",
        primaryText: "Stop waiting for dead limbs to fall on your roof. TimberShield matches you with licensed, insured certified arborists—and free same-day storm damage estimates are available across the metro area.",
        ctaText: 'See Details',
        labelNames: ['Direct Response']
      },
      {
        srcFile: path.join(workspaceRoot, 'src/assets/images/seo_campaign_ad_1790776836401.jpg'),
        destFilename: 'seo_rankings_growth_ad.jpg',
        folderName: 'SEO Campaigns',
        advertiserName: 'RankLocal Marketing',
        headline: "Swipe This Local Agency Playbook",
        primaryText: "How we took a local home services contractor from page 4 to #1 on Google in 90 days flat: 47 hyper-targeted neighborhood pages, automated GoHighLevel reviews, and schema markup.",
        ctaText: 'Learn More',
        labelNames: ['Direct Response', 'HighLevel']
      },
      {
        srcFile: path.join(workspaceRoot, 'src/assets/images/web_design_ad_1790776846116.jpg'),
        destFilename: 'editorial_landing_showcase.jpg',
        folderName: 'Web Design Inspiration',
        advertiserName: 'Minimalist Landing Pages',
        headline: "The 3-Second Hook Framework",
        primaryText: "Landing page breakdown: Notice how the hero headline uses high-contrast typography with zero fluff, leading straight into a 1-sentence value outcome and a frictionless single-field input.",
        ctaText: 'See Details',
        labelNames: ['Carousel']
      },
      {
        srcFile: path.join(workspaceRoot, 'src/assets/images/b2b_saas_ad_1790776856368.jpg'),
        destFilename: 'b2b_pipeline_software_ad.jpg',
        folderName: 'B2B SaaS',
        advertiserName: 'PipelineFlow AI',
        headline: "Automate Inbound Lead Conversion",
        primaryText: "Stop losing 60% of your qualified inbound demo requests to delayed follow-ups. Our automated pipeline routes, enriches, and schedules calls within 90 seconds of submission.",
        ctaText: 'Get Offer',
        labelNames: ['Video Hook', 'HighLevel']
      }
    ];

    for (const sample of sampleImages) {
      const destPath = path.join(MEDIA_DIR, sample.destFilename);

      if (fs.existsSync(sample.srcFile)) {
        try {
          fs.copyFileSync(sample.srcFile, destPath);
        } catch (e) {
          console.warn('Could not copy asset image:', e);
        }
      }

      // Find folder ID
      const folderQuery = db.exec(`SELECT id FROM folders WHERE name = '${sample.folderName.replace(/'/g, "''")}'`);
      const folderId = folderQuery.length > 0 && folderQuery[0].values.length > 0
        ? (folderQuery[0].values[0][0] as number)
        : null;

      // Insert ad with separate headline and description
      const now = new Date().toISOString();
      const combinedCopy = `${sample.primaryText}\n\n${sample.headline}`;
      const insertAdStmt = db.prepare(`
        INSERT INTO ads (
          media_path, advertiser_name, primary_text, headline, cta_text, text_copy, folder_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertAdStmt.run([
        destPath,
        sample.advertiserName,
        sample.primaryText,
        sample.headline,
        sample.ctaText,
        combinedCopy,
        folderId,
        now
      ]);
      insertAdStmt.free();

      // Retrieve inserted ad ID
      const lastIdRes = db.exec("SELECT last_insert_rowid()");
      const adId = lastIdRes[0].values[0][0] as number;

      // Link labels
      for (const labelName of sample.labelNames) {
        const labelQuery = db.exec(`SELECT id FROM labels WHERE name = '${labelName.replace(/'/g, "''")}'`);
        if (labelQuery.length > 0 && labelQuery[0].values.length > 0) {
          const labelId = labelQuery[0].values[0][0] as number;
          db.run(`INSERT OR IGNORE INTO ad_labels (ad_id, label_id) VALUES (${adId}, ${labelId})`);
        }
      }
    }
  }
}

// Database query helpers
export async function getFolders(): Promise<Folder[]> {
  const db = await getDb();
  const query = `
    SELECT f.id, f.name, COUNT(a.id) as ad_count
    FROM folders f
    LEFT JOIN ads a ON a.folder_id = f.id
    GROUP BY f.id, f.name
    ORDER BY f.name ASC
  `;
  const result = db.exec(query);
  if (!result.length) return [];
  const rows = result[0].values;
  return rows.map(r => ({
    id: r[0] as number,
    name: r[1] as string,
    ad_count: Number(r[2] || 0)
  }));
}

export async function createFolder(name: string): Promise<Folder> {
  const db = await getDb();
  const stmt = db.prepare("INSERT INTO folders (name) VALUES (?)");
  stmt.run([name.trim()]);
  stmt.free();

  const idRes = db.exec("SELECT last_insert_rowid()");
  const newId = idRes[0].values[0][0] as number;
  saveDb(db);
  return { id: newId, name: name.trim(), ad_count: 0 };
}

export async function deleteFolder(id: number): Promise<void> {
  const db = await getDb();
  // Safe cascade: dissociate ads from this folder first
  db.run(`UPDATE ads SET folder_id = NULL WHERE folder_id = ${id}`);
  db.run(`DELETE FROM folders WHERE id = ${id}`);
  saveDb(db);
}

export async function getLabels(): Promise<Label[]> {
  const db = await getDb();
  const query = `
    SELECT l.id, l.name, l.color, COUNT(al.ad_id) as ad_count
    FROM labels l
    LEFT JOIN ad_labels al ON al.label_id = l.id
    GROUP BY l.id, l.name, l.color
    ORDER BY l.name ASC
  `;
  const result = db.exec(query);
  if (!result.length) return [];
  const rows = result[0].values;
  return rows.map(r => ({
    id: r[0] as number,
    name: r[1] as string,
    color: r[2] as string,
    ad_count: Number(r[3] || 0)
  }));
}

export async function createLabel(name: string, color: string): Promise<Label> {
  const db = await getDb();
  const stmt = db.prepare("INSERT INTO labels (name, color) VALUES (?, ?)");
  stmt.run([name.trim(), color.trim()]);
  stmt.free();

  const idRes = db.exec("SELECT last_insert_rowid()");
  const newId = idRes[0].values[0][0] as number;
  saveDb(db);
  return { id: newId, name: name.trim(), color: color.trim(), ad_count: 0 };
}

export async function deleteLabel(id: number): Promise<void> {
  const db = await getDb();
  db.run(`DELETE FROM ad_labels WHERE label_id = ${id}`);
  db.run(`DELETE FROM labels WHERE id = ${id}`);
  saveDb(db);
}

export async function getAds(options?: {
  folderId?: number;
  labelId?: number;
  search?: string;
}): Promise<Ad[]> {
  const db = await getDb();
  let whereClauses: string[] = [];

  if (options?.folderId !== undefined) {
    whereClauses.push(`a.folder_id = ${options.folderId}`);
  }

  if (options?.labelId !== undefined) {
    whereClauses.push(`EXISTS (SELECT 1 FROM ad_labels al WHERE al.ad_id = a.id AND al.label_id = ${options.labelId})`);
  }

  if (options?.search && options.search.trim().length > 0) {
    const cleanSearch = options.search.trim().replace(/'/g, "''");
    whereClauses.push(`(
      a.primary_text LIKE '%${cleanSearch}%' OR 
      a.headline LIKE '%${cleanSearch}%' OR 
      a.advertiser_name LIKE '%${cleanSearch}%' OR 
      a.text_copy LIKE '%${cleanSearch}%' OR 
      f.name LIKE '%${cleanSearch}%'
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    SELECT 
      a.id, 
      a.media_path, 
      a.advertiser_name,
      a.primary_text,
      a.headline,
      a.cta_text,
      a.text_copy, 
      a.folder_id, 
      a.created_at, 
      f.name as folder_name
    FROM ads a
    LEFT JOIN folders f ON f.id = a.folder_id
    ${whereSql}
    ORDER BY a.created_at DESC
  `;

  const result = db.exec(query);
  if (!result.length) return [];

  const adsList: Ad[] = [];
  const rows = result[0].values;

  for (const r of rows) {
    const adId = r[0] as number;
    const mediaPath = r[1] as string;
    const advertiserName = (r[2] as string) || (r[9] as string) || 'Advertiser';
    const primaryText = (r[3] as string) || (r[6] as string) || '';
    const headline = (r[4] as string) || 'Learn More';
    const ctaText = (r[5] as string) || 'See Details';
    const textCopy = (r[6] as string) || '';
    const folderId = r[7] !== null ? (r[7] as number) : null;
    const createdAt = r[8] as string;
    const folderName = (r[9] as string) || null;

    // Fetch labels for this ad
    const labelQuery = `
      SELECT l.id, l.name, l.color
      FROM labels l
      JOIN ad_labels al ON al.label_id = l.id
      WHERE al.ad_id = ${adId}
    `;
    const labelRes = db.exec(labelQuery);
    const labels: Label[] = [];
    if (labelRes.length > 0) {
      for (const lr of labelRes[0].values) {
        labels.push({
          id: lr[0] as number,
          name: lr[1] as string,
          color: lr[2] as string
        });
      }
    }

    adsList.push({
      id: adId,
      media_path: mediaPath,
      media_filename: path.basename(mediaPath),
      advertiser_name: advertiserName,
      primary_text: primaryText,
      headline: headline,
      cta_text: ctaText,
      text_copy: textCopy || `${primaryText}\n\n${headline}`,
      folder_id: folderId,
      folder_name: folderName,
      created_at: createdAt,
      labels
    });
  }

  return adsList;
}

export async function createAd(params: {
  media_path: string;
  advertiser_name?: string;
  primary_text?: string;
  headline?: string;
  cta_text?: string;
  text_copy?: string;
  folder_id?: number | null;
  label_ids?: number[];
}): Promise<Ad> {
  const db = await getDb();
  const now = new Date().toISOString();

  const advertiserName = params.advertiser_name?.trim() || 'Advertiser';
  const primaryText = params.primary_text?.trim() || params.text_copy?.trim() || '';
  const headline = params.headline?.trim() || '';
  const ctaText = params.cta_text?.trim() || 'See Details';
  const combinedCopy = `${primaryText}\n\n${headline}`.trim();

  const stmt = db.prepare(`
    INSERT INTO ads (
      media_path, advertiser_name, primary_text, headline, cta_text, text_copy, folder_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    params.media_path,
    advertiserName,
    primaryText,
    headline,
    ctaText,
    combinedCopy,
    params.folder_id || null,
    now
  ]);
  stmt.free();

  const idRes = db.exec("SELECT last_insert_rowid()");
  const adId = idRes[0].values[0][0] as number;

  if (params.label_ids && params.label_ids.length > 0) {
    for (const labelId of params.label_ids) {
      db.run(`INSERT OR IGNORE INTO ad_labels (ad_id, label_id) VALUES (${adId}, ${labelId})`);
    }
  }

  saveDb(db);

  const ads = await getAds();
  const created = ads.find(a => a.id === adId);
  if (!created) {
    throw new Error('Failed to retrieve newly created ad');
  }
  return created;
}

export async function updateAd(id: number, params: {
  advertiser_name?: string;
  primary_text?: string;
  headline?: string;
  cta_text?: string;
  text_copy?: string;
  folder_id?: number | null;
  label_ids?: number[];
}): Promise<Ad> {
  const db = await getDb();
  const allAds = await getAds();
  const existing = allAds.find(a => a.id === id);

  const advertiserName = params.advertiser_name !== undefined 
    ? (params.advertiser_name.trim() || 'Advertiser') 
    : (existing?.advertiser_name || 'Advertiser');
    
  const primaryText = params.primary_text !== undefined 
    ? params.primary_text.trim() 
    : (existing?.primary_text || '');
    
  const headline = params.headline !== undefined 
    ? params.headline.trim() 
    : (existing?.headline || 'Learn More');
    
  const ctaText = params.cta_text !== undefined 
    ? params.cta_text.trim() 
    : (existing?.cta_text || 'See Details');
    
  const folderId = params.folder_id !== undefined 
    ? params.folder_id 
    : (existing ? existing.folder_id : null);

  const combinedCopy = `${primaryText}\n\n${headline}`.trim();

  const stmt = db.prepare(`
    UPDATE ads 
    SET advertiser_name = ?, primary_text = ?, headline = ?, cta_text = ?, text_copy = ?, folder_id = ? 
    WHERE id = ?
  `);
  stmt.run([
    advertiserName,
    primaryText,
    headline,
    ctaText,
    combinedCopy,
    folderId,
    id
  ]);
  stmt.free();

  if (params.label_ids !== undefined) {
    db.run(`DELETE FROM ad_labels WHERE ad_id = ${id}`);
    for (const labelId of params.label_ids) {
      db.run(`INSERT OR IGNORE INTO ad_labels (ad_id, label_id) VALUES (${id}, ${labelId})`);
    }
  }

  saveDb(db);

  const ads = await getAds();
  const updated = ads.find(a => a.id === id);
  if (!updated) {
    throw new Error('Failed to retrieve updated ad');
  }
  return updated;
}

export async function deleteAd(id: number, deleteLocalFile = false): Promise<void> {
  const db = await getDb();

  if (deleteLocalFile) {
    const res = db.exec(`SELECT media_path FROM ads WHERE id = ${id}`);
    if (res.length > 0 && res[0].values.length > 0) {
      const filePath = res[0].values[0][0] as string;
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Failed to delete media file from disk:', e);
        }
      }
    }
  }

  db.run(`DELETE FROM ad_labels WHERE ad_id = ${id}`);
  db.run(`DELETE FROM ads WHERE id = ${id}`);
  saveDb(db);
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const db = await getDb();
  const ads = await getAds();
  const folders = await getFolders();
  const labels = await getLabels();

  let storageSizeBytes = 0;
  if (fs.existsSync(DB_PATH)) {
    storageSizeBytes += fs.statSync(DB_PATH).size;
  }
  if (fs.existsSync(MEDIA_DIR)) {
    const mediaFiles = fs.readdirSync(MEDIA_DIR);
    for (const file of mediaFiles) {
      try {
        storageSizeBytes += fs.statSync(path.join(MEDIA_DIR, file)).size;
      } catch {
        // ignore
      }
    }
  }

  return {
    baseDir: BASE_DATA_DIR,
    mediaDir: MEDIA_DIR,
    dbPath: DB_PATH,
    totalAds: ads.length,
    totalFolders: folders.length,
    totalLabels: labels.length,
    storageSizeBytes
  };
}
