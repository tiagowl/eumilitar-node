import { S3 } from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 } from 'uuid';
import mime from 'mime';
import { StorageSettings } from './interfaces';

interface StorageTypes {
    [s: string]: multer.StorageEngine;
}


export default function createStorage(settings: StorageSettings) {
    const { credentials, bucket, destination, permission } = settings;
    function createFileName(_: any, file: Express.MulterS3.File, cb: (error: Error | null, filename: string) => void) {
        try {
            const fileExtension = mime.getExtension(file.mimetype);
            const now = new Date().toISOString();
            const id = v4();
            cb(null, `${destination}${id}-${now}.${fileExtension}`);
        } catch {
            cb(new Error('Erro ao nomear arquivo'), '');
        }
    }
    const storageTypes: StorageTypes = {
        s3: multerS3({
            s3: new S3({ credentials, }),
            bucket,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            acl: permission,
            key: createFileName,
        }),
        local: multer.diskStorage({
            destination: (_req, _file, cb) => {
                try {
                    cb(null, settings.local.destination);
                } catch (error: any) {
                    cb(new Error('Erro ao salvar arquivo'), '');
                }
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
            try {
                if (settings.allowedMimes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error("Invalid file type."));
                }
            } catch {
                cb(new Error('Erro ao verificar tipo do arquivo'));
            }
        },
    });

}