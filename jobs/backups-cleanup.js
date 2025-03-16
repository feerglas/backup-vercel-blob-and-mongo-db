// todo:
// - log deleted buckets

import { S3Helper } from '../helpers/s3.js';
import config from '../config.js';
import { sortBucketsNewestFirst } from '../helpers/date.js';

const cleanUpBucketsWithPrefix = async (prefix, allBuckets, s3Helper) => {
  const buckets = allBuckets.filter((bucket) => bucket.Name.indexOf(prefix) !== -1);
  const bucketsSorted = sortBucketsNewestFirst(buckets);
  const bucketsToDelete = JSON.parse(JSON.stringify(bucketsSorted)).splice(config.keepAmountOfBackups, bucketsSorted.length - config.keepAmountOfBackups);

  for (const bucketToDelete of bucketsToDelete) {
    await s3Helper.deleteBucket(bucketToDelete.Name);
  }
}

export default async () => {
  try {
    const s3Helper = new S3Helper();
    const buckets = await s3Helper.getAllBuckets();

    await cleanUpBucketsWithPrefix(config.blobBackupBucketPrefix, buckets, s3Helper);
    await cleanUpBucketsWithPrefix(config.dbBackupBucketPrefix, buckets, s3Helper);

    console.log('--> Backups cleanup done');
    

  } catch (error) {
    console.log(error);
  }
}