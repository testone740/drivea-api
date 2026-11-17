import multer from 'multer';

const storage = multer.diskStorage();

const maxFileSize = process.env.MAX_FILE_ZIE ? Number(process.env.MAX_FILE_ZIE) : 104857600; // 100MB

export const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
});
