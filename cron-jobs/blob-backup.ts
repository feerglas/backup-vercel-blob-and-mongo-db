// Ideally executed as cron-job.

// todo:
// - integrity check: after backup, count objects in blob and in backup
// - log amount of objects

import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import * as blobHelpers from '../helpers/blob.ts';
import { S3Helper } from '../helpers/s3.ts';
import { dateString } from '../helpers/date.ts';
import config from '../config.ts';

const main = async () => {
  /*
  // If run as cron-job on vercel, make sure that only cron-jobs can execute
  // the script.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  */

  try {
    const s3Helper = new S3Helper();
    const bucketName = `${dateString()}-${config.blobBackupBucketPrefix}`;

    const blobs = await blobHelpers.getAllBlobs();
    await s3Helper.createBucket(bucketName);

    await Promise.all(
      blobs.map(async (blob) => {
        if (blob) {
          const res = await fetch(blob.url);
          if (res.body) {
            await s3Helper.addObject(
              bucketName,
              blob.pathname,
              Readable.fromWeb(res.body as ReadableStream)
            );
          }
        }
      })
    );

    console.log('-->> Backup done: Vercel Blob data to OVH S3');

  } catch (error) {
    console.log(error);
  }
}

export default main;

main();