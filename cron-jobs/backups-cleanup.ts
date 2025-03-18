// Ideally executed as cron-job.

// todo:
// - log deleted buckets

import { S3Helper } from '../helpers/s3.ts';
import config from '../config.ts';
import { sortBucketsNewestFirst } from '../helpers/date.ts';
import mail from '../helpers/mail.ts';

const cleanUpBucketsWithPrefix = async (prefix, allBuckets, s3Helper): Promise<[String?]> => {
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

  if (bucketsToDelete.length === 0) {
    return [];
  }

  return [bucketsToDelete.map((bucket) => bucket.Name)]; 
}

const main = async () => {
  try {
    const s3Helper = new S3Helper();
    const buckets = await s3Helper.getAllBuckets();

    const deletedBlobBuckets = await cleanUpBucketsWithPrefix(config.blobBackupBucketPrefix, buckets, s3Helper);
    const deletedDbBuckets = await cleanUpBucketsWithPrefix(config.dbBackupBucketPrefix, buckets, s3Helper);

    const mailMessage = `Deleted ${deletedBlobBuckets.length} blob buckets and ${deletedDbBuckets.length} db buckets.<br><br>Deleted blob buckets: ${deletedBlobBuckets.join('<br>')}<br><br>Deleted db buckets: ${deletedDbBuckets.join('<br>')}`
    await mail(
      '--> Backups cleanup success',
      mailMessage,
      false,
    );

    console.log('--> Backups cleanup done');


  } catch (error) {
    await mail(
      '--> Backups cleanup failure',
      error,
      true,
    );

    console.log(error);
  }
}

export default main;

main();