import multer from "multer";
import path from "path";
import crypto from 'crypto';


const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 mb
    },
    fileFilter: (_req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const extension = path.extname(file.originalname).toLowerCase();
        const isValid = allowedExtensions.includes(extension);

        if (isValid) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
})
