// Ideally executed as cron-job.

// todo:
// - log deleted buckets

import { S3Helper } from '../helpers/s3.ts';
import config from '../config.ts';
import { sortBucketsNewestFirst } from '../helpers/date.ts';

const cleanUpBucketsWithPrefix = async (prefix, allBuckets, s3Helper) => {
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

  const buckets = allBuckets.filter((bucket) => bucket.Name.indexOf(prefix) !== -1);
  const bucketsSorted = sortBucketsNewestFirst(buckets);
  const bucketsToDelete = JSON.parse(JSON.stringify(bucketsSorted)).splice(config.keepAmountOfBackups, bucketsSorted.length - config.keepAmountOfBackups);

  for (const bucketToDelete of bucketsToDelete) {
    await s3Helper.deleteBucket(bucketToDelete.Name);
  }
}

const main = async () => {
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

export default main;

main();