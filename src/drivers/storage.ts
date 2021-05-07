import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 } from 'uuid';
import mime from 'mime';
import path from 'path';

interface StorageTypes {
    [s: string]: multer.StorageEngine
}

function createFileName(_: any, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const fileExtension = mime.getExtension(file.mimetype);
    const now = new Date().toISOString();
    const id = v4();
    const name = `${id}-${now}.${fileExtension}`;
    cb(null, name);
}

export default function createStorage(settings: any) {
    const destination = settings.local.destination
    const storageTypes: StorageTypes = {
        s3: multerS3({
            s3: new aws.S3(),
            bucket: settings.bucket,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            acl: settings.permission,
            key: createFileName,
        }),
        local: multer.diskStorage({
            destination: (_req, _file, cb) => {
                cb(null, destination);
            },
            filename: createFileName,
        }),
    }
    return multer({
        dest: destination,
        storage: storageTypes[settings.type],
        limits: {
            fileSize: settings.maxSize,
        },
        fileFilter: (_, file, cb) => {
            if (settings.allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Invalid file type."));
            }
        },
    })

}