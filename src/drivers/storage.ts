import { S3 } from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 } from 'uuid';
import mime from 'mime';

interface StorageTypes {
    [s: string]: multer.StorageEngine;
}


export default function createStorage(settings: any) {
    const { credentials, bucket, destination } = settings;
    function createFileName(_: any, file: Express.MulterS3.File, cb: (error: Error | null, destination: string) => void) {
        const fileExtension = mime.getExtension(file.mimetype);
        const now = new Date().toISOString();
        const id = v4();
        const name = `${destination}${id}-${now}.${fileExtension}`;
        cb(null, name);
    }
    const storageTypes: StorageTypes = {
        s3: multerS3({
            s3: new S3({
                credentials,
            }),
            bucket,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            // acl: settings.permission,
            key: createFileName,
        }),
        local: multer.diskStorage({
            destination: (_req, _file, cb) => {
                cb(null, settings.local.destination);
            },
            filename: createFileName,
        }),
    };
    return multer({
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
    });

}