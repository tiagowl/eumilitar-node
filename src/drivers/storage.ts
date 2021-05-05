import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import settings from '../settings';
import { v4 } from 'uuid';
import mime from 'mime';
import path from 'path';

interface StorageTypes {
    [s: string]: multer.StorageEngine
}

const s3 = new aws.S3()

function createFileName(_: any, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const fileExtension = mime.getExtension(file.mimetype);
    const now = new Date().toISOString();
    const id = v4();
    const name = `${id}-${now}.${fileExtension}`;
    cb(null, name);
}

const storageTypes: StorageTypes = {
    s3: multerS3({
        s3,
        bucket: settings.storage.bucket,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: settings.storage.permission,
        key: createFileName,
    }),
    local: multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, path.resolve(__dirname, "..", "..", "tmp", "uploads"));
        },
        filename: createFileName,
    }),
}

const storage = multer({
    dest: path.resolve(__dirname, "..", "..", "tmp", "uploads"),
    storage: storageTypes[settings.storage.type],
    limits: {
        fileSize: settings.storage.maxSize,
    },
    fileFilter: (_, file, cb) => {
        if (settings.storage.allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type."));
        }
    },
})

export default storage;