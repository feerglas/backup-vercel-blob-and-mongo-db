// Ideally executed as cron-job.

import dotenv from 'dotenv';
import { EJSON } from 'bson';
import { S3Helper } from '../helpers/s3.ts';
import { DbHelper } from '../helpers/db.ts';
import { dateString } from '../helpers/date.ts';
import config from '../config.ts';
import mail from '../helpers/mail.ts';

dotenv.config();

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

  const dbHelper = new DbHelper();

  try {
    const s3Helper = new S3Helper();

    const bucketName = `${dateString()}-${config.dbBackupBucketPrefix}`;

    await s3Helper.createBucket(bucketName);

    if (!process.env.DATABASE_NAME) {
      throw new Error('Aborting. DATABASE_NAME is not defined in env.');
    }

    const collections = await dbHelper.getCollections(process.env.DATABASE_NAME);
    let collectionBackupCount = 0;

    for (const collection of collections) {
      const { collectionName } = collection;

      if (!collectionName.startsWith('system.')) {
        collectionBackupCount++;
        const results = await dbHelper.getContentOfCollection(collection);

        await s3Helper.addObject(bucketName, `${collectionName}.json`, EJSON.stringify(results));
      }
    }

    const mailMessage = `Successfully backed up ${collectionBackupCount} colletions from MongoDb to OVH S3`;

    await mail(
      '-->> Backup done: DB on OVH to OVH S3',
      mailMessage,
      false,
    );

    console.log(mailMessage);

  } catch (error) {
    await mail(
      '--> Backup failure: DB on OVH to OVH S3',
      error,
      true,
    );

    console.log(error);
  } finally {
    dbHelper.getClient().close();
  }
}

export default main;

main();