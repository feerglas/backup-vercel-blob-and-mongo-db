// todo:
// - integrity check: after restore, count objects in blob and in backup
// - log amount of restored objects
// - if backup is found: make interactive cli, ask if user is really sure
// that he wants to delete all data and restore from backup

import * as blobHelpers from '../helpers/blob.js';
import { S3Helper } from '../helpers/s3.js';
import config from '../config.js';
import { sortBucketsNewestFirst } from "../helpers/date.js";

export default async () => {
  try {
    const s3Helper = new S3Helper();

    const buckets = await s3Helper.getAllBuckets();
    const blobBuckets = buckets.filter((bucket) => bucket.Name.indexOf(config.blobBackupBucketPrefix) !== -1);

    if (!blobBuckets || blobBuckets.length < 1) {
      console.log('no backups found to restore');

      return;
    }

    const latestBlobBucket = sortBucketsNewestFirst(blobBuckets)[0];

    // TODO: make interactive cli, ask if user is really sure
    // that he wants to delete all data and restore from backup

    await blobHelpers.deleteAllBlobs();

    const objects = await s3Helper.listObjectsOfBucket(latestBlobBucket.Name);

    await Promise.all(
      objects.map(async (object) => {
        const objectData = await s3Helper.getObject(latestBlobBucket.Name, object);
        await blobHelpers.addBlob(object, objectData);
      })
    );

    console.log('-->> Restore done: OVH S3 to Vercel blob data');


  } catch (error) {
    console.log(error);
  }
}