// todo:
// - integrity check: after backup, count objects in db and in backup
// - log amount of objects

import { S3Helper } from '../helpers/s3.ts';
import { DbHelper } from '../helpers/db.ts';
import { dateString } from '../helpers/date.ts';
import config from '../config.ts';

export default async (dbName) => {
  const dbHelper = new DbHelper();

  try {
    const s3Helper = new S3Helper();

    const bucketName = `${dateString()}-${config.dbBackupBucketPrefix}`;

    await s3Helper.createBucket(bucketName);

    const collections = await dbHelper.getCollections(dbName);

    for (const collection of collections) {
      const { collectionName } = collection;

      if (!collectionName.startsWith('system.')) {
        const results = await collection.find({}).toArray();

        await s3Helper.addObject(bucketName, `${collectionName}.json`, JSON.stringify(results));
      }
    }

    console.log('-->> Backup done: DB on OVH to OVH S3');

  } catch (error) {
    console.log(error);
  } finally {
    dbHelper.getClient().close();
  }
}