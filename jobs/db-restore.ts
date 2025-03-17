import chalk from 'chalk';
import { S3Helper } from '../helpers/s3.ts';
import { DbHelper } from '../helpers/db.ts';
import config from '../config.ts';
import { sortBucketsNewestFirst } from "../helpers/date.ts";
import {
  inquirerAskForProceed,
  inquirerAskBucketToRestore
} from '../helpers/inquirer.ts';

export default async (dbName) => {
  const dbHelper = new DbHelper();

  try {
    const proceedMessage = `Restore DB from S3 to OVH. ${chalk.red('This is a destructive process. Collections from the backup will overwrite the existing collections in MongoDB.')}`;
    const proceed = await inquirerAskForProceed(proceedMessage);

    if (!proceed) {
      throw new Error('User aborted.');
    }

    const s3Helper = new S3Helper();
    const buckets = await s3Helper.getAllBuckets();
    const dbBuckets = buckets.filter((bucket) => bucket?.Name?.indexOf(config.dbBackupBucketPrefix) !== -1);

    if (!dbBuckets || dbBuckets.length < 1) {
      throw new Error('no backups found to restore');
    }

    const sortedBlockBuckets = sortBucketsNewestFirst(dbBuckets);
    const selectedBucket = await inquirerAskBucketToRestore(sortedBlockBuckets);
    const allObjectsInBucket = await s3Helper.listObjectsOfBucket(selectedBucket);

    const finalConfirmationMessage = `I am about to restore ${chalk.green(allObjectsInBucket.length)} collections from S3 Bucket named ${chalk.green(selectedBucket)} to MongoDB. Are you sure you want to continue?`;
    const finalConfirmation = await inquirerAskForProceed(finalConfirmationMessage);

    if (!finalConfirmation) {
      console.log('aborting');

      return;
    }
    
    await Promise.all(
      allObjectsInBucket.map(async (object) => {
        if (object) {

          const collectionNameSplit = object.split('.json');
          
          if (collectionNameSplit.length === 2) {
            const [collectionName] = collectionNameSplit;
            const objectData = await s3Helper.getObject(selectedBucket, object);
            await dbHelper.deleteCollection(dbName, collectionName);
            const parsed = JSON.parse(objectData);
            if (parsed.length > 0) {
              await dbHelper.addDocumentsToColletion(dbName, collectionName, parsed);
            }
  
          }
        }
      })
    );

    console.log(chalk.bgGreen('-->> Restore done: OVH S3 to MongoDB'));

  } catch (error) {
    console.log(chalk.bgRed(error));
  } finally {
    dbHelper.getClient().close();
  }
}