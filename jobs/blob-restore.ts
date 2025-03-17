import chalk from 'chalk';
import * as blobHelpers from '../helpers/blob.ts';
import { S3Helper } from '../helpers/s3.ts';
import config from '../config.ts';
import { sortBucketsNewestFirst } from "../helpers/date.ts";
import {
  inquirerAskForProceed,
  inquirerAskBucketToRestore
} from '../helpers/inquirer.ts';

export default async () => {
  try {

    const proceedMessage = `Restore blob storage from S3 to Vercel. ${chalk.red('This is a destructive process. All data from Vercel Blob will be deleted in order to restore the data from the S3 Backup')}`;
    const proceed = await inquirerAskForProceed(proceedMessage);

    if (!proceed) {
      throw new Error('User aborted.');
    }

    const s3Helper = new S3Helper();
    const buckets = await s3Helper.getAllBuckets();
    const blobBuckets = buckets.filter((bucket) => bucket?.Name?.indexOf(config.blobBackupBucketPrefix) !== -1);

    if (!blobBuckets || blobBuckets.length < 1) {
      throw new Error('no backups found to restore');
    }

    const sortedBlockBuckets = sortBucketsNewestFirst(blobBuckets);
    const selectedBucket = await inquirerAskBucketToRestore(sortedBlockBuckets);
    const allObjectsInBucket = await s3Helper.listObjectsOfBucket(selectedBucket);
    const allBlobs = await blobHelpers.getAllBlobs();

    const finalConfirmationMessage = `I am about to delete ${chalk.red(allBlobs.length)} objects in Vercel Blob and restore ${chalk.green(allObjectsInBucket.length)} objects from S3 Bucket named ${chalk.green(selectedBucket)} to Vercel blob. Are you sure you want to continue?`;
    const finalConfirmation = await inquirerAskForProceed(finalConfirmationMessage);

    if (!finalConfirmation) {
      console.log('aborting');

      return;
    }


    await blobHelpers.deleteAllBlobs();

    await Promise.all(
      allObjectsInBucket.map(async (object) => {
        if (object) {
          const objectData = await s3Helper.getObject(selectedBucket, object);
          await blobHelpers.addBlob(object, objectData);
        }
      })
    );

    // integrity check: check if all data was restored
    const newBlobs = await blobHelpers.getAllBlobs();

    if (newBlobs.length !== allObjectsInBucket.length) {
      throw new Error('Integrity fail: it seems that not all objects from S3 were restored to Vercel blob.');
    }

    console.log(chalk.bgGreen('-->> Restore done: OVH S3 to Vercel blob data'));


  } catch (error) {
    console.log(chalk.bgRed(error));
  }
}