import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, '../../uploads');

['avatars', 'posts'].forEach((dir) => {
  const p = path.join(uploadRoot, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = (subfolder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadRoot, subfolder)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });

const imageVideoFilter = (_req, file, cb) => {
  const ok =
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/');
  cb(null, ok);
};

export const uploadAvatar = multer({
  storage: storage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

export const uploadPostMedia = multer({
  storage: storage('posts'),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: imageVideoFilter,
});

export function publicUploadPath(subfolder, filename) {
  return `/uploads/${subfolder}/${filename}`;
}
