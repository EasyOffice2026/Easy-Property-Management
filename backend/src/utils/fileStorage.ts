import fs from 'fs';
import path from 'path';
import multer from 'multer';

export const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const TENANT_DOCS_DIR = path.join(UPLOAD_ROOT, 'tenant-documents');

fs.mkdirSync(TENANT_DOCS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TENANT_DOCS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const documentUpload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

export function toPublicUrl(filename: string): string {
  return `/uploads/tenant-documents/${filename}`;
}
