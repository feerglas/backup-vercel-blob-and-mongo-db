// todo:
// - integrity check: after backup, count objects in blob and in backup
// - log amount of objects

import { Readable } from 'node:stream';
import * as blobHelpers from '../helpers/blob.js';
import { S3Helper } from '../helpers/s3.js';
import { dateString } from '../helpers/date.js';
import config from '../config.js';

export default async () => {
  try {
    const s3Helper = new S3Helper();
    const bucketName = `${dateString()}-${config.blobBackupBucketPrefix}`;

    const blobs = await blobHelpers.getAllBlobs();
    await s3Helper.createBucket(bucketName);

    await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url);
        if (res.body) {
          await s3Helper.addObject(
            bucketName,
            blob.pathname,
            Readable.fromWeb(res.body)
          );
        }
      })
    );

    console.log('-->> Backup done: Vercel Blob data to OVH S3');

  } catch (error) {
    console.log(error);
  }
}