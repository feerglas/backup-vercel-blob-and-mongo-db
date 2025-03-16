// todo:
// - integrity check: after restore, count objects in blob and in backup
// - log amount of restored objects
// - if backup is found: make interactive cli, ask if user is really sure
// that he wants to delete all data and restore from backup

import { S3Helper } from '../helpers/s3.ts';
import { DbHelper } from '../helpers/db.ts';
import config from '../config.ts';
import { sortBucketsNewestFirst } from "../helpers/date.ts";

export default async (dbName) => {
  const dbHelper = new DbHelper();

  try {
    const s3Helper = new S3Helper();

    const buckets = await s3Helper.getAllBuckets();
    const dbBuckets = buckets.filter((bucket) => bucket?.Name?.indexOf(config.dbBackupBucketPrefix) !== -1);

    if (!dbBuckets || dbBuckets.length < 1) {
      console.log('no backups found to restore');

      return;
    }

    const latestBlobBucket = sortBucketsNewestFirst(dbBuckets)[0];

    // TODO: make interactive cli, ask if user is really sure
    // that he wants to delete all data and restore from backup

    const objects = await s3Helper.listObjectsOfBucket(latestBlobBucket.Name);
    
    await Promise.all(
      objects.map(async (object) => {
        if (object) {

          const collectionNameSplit = object.split('.json');
          
          if (collectionNameSplit.length === 2) {
            const [collectionName] = collectionNameSplit;
            const objectData = await s3Helper.getObject(latestBlobBucket.Name, object);
            await dbHelper.deleteCollection(dbName, collectionName);
            const parsed = JSON.parse(objectData);
            if (parsed.length > 0) {
              await dbHelper.addDocumentsToColletion(dbName, collectionName, parsed);
            }
  
          }
        }
      })
    );

    console.log('-->> Restore done: OVH S3 to OVH MongoDB');

  } catch (error) {
    console.log(error);
  } finally {
    dbHelper.getClient().close();
  }
}