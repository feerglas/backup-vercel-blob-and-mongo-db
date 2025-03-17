import dotenv from 'dotenv';
import { S3Helper } from '../helpers/s3.ts';
import { DbHelper } from '../helpers/db.ts';
import { dateString } from '../helpers/date.ts';
import config from '../config.ts';

dotenv.config();

const main = async () => {
  const dbHelper = new DbHelper();

  try {
    const s3Helper = new S3Helper();

    const bucketName = `${dateString()}-${config.dbBackupBucketPrefix}`;

    await s3Helper.createBucket(bucketName);

    if (!process.env.DATABASE_NAME) {
      console.log('Aborting. DATABASE_NAME is not defined in env.');
      
      return;
    }

    const collections = await dbHelper.getCollections(process.env.DATABASE_NAME);

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

export default main;

main();