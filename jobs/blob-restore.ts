// todo:
// - integrity check: after restore, count objects in blob and in backup
// - log amount of restored objects

import * as blobHelpers from '../helpers/blob.ts';
import { S3Helper } from '../helpers/s3.ts';
import config from '../config.ts';
import { sortBucketsNewestFirst } from "../helpers/date.ts";
import inquirer from 'inquirer';
import type { Bucket } from '@aws-sdk/client-s3';

const inquirerAskForProceed = async (): Promise<Boolean> => {
  const answerNo = 'No';
  const answers = await inquirer.prompt(
    [
      {
        type: 'list',
        name: 'proceed',
        message: 'This is a destructive process. All data from Vercel Blob will be deleted in order to restore the data from the S3 Backup.\nAre you sure you want to continue?',
        choices: [
          answerNo,
          'Yes',
        ]
      },
    ]
  );

  return answers.proceed !== answerNo;
}

const inquirerAskBucketToRestore = async (buckets: Bucket[]): Promise<string> => {

  const answers = await inquirer.prompt(
    [
      {
        type: 'list',
        name: 'bucket',
        message: 'Select the backup which should be restored.',
        choices: buckets.map((bucket) => bucket.Name ? bucket.Name : ''),
      },
    ]
  );

  return answers.bucket;
}

const inquirerFinalConfirmation = async (bucketName: string, blobCount: number, s3Count: number): Promise<boolean> => {
  const answerNo = 'No';
  const answers = await inquirer.prompt(
    [
      {
        type: 'list',
        name: 'finalConfirmation',
        message: `I am about to delete ${blobCount} objects in Vercel Blob and restore ${s3Count} objects from S3 Bucket named ${bucketName} to Vercel blob. Are you sure you want to continue?`,
        choices: [
          answerNo,
          'Yes',
        ]
      },
    ]
  );

  return answers.finalConfirmation !== answerNo;
}

export default async () => {
  try {

    const proceed = await inquirerAskForProceed();

    if (!proceed) {
      console.log('aborting');

      return;
    }

    const s3Helper = new S3Helper();

    const buckets = await s3Helper.getAllBuckets();
    const blobBuckets = buckets.filter((bucket) => bucket?.Name?.indexOf(config.blobBackupBucketPrefix) !== -1);

    if (!blobBuckets || blobBuckets.length < 1) {
      console.log('no backups found to restore');

      return;
    }

    const sortedBlockBuckets = sortBucketsNewestFirst(blobBuckets);
    const selectedBucket = await inquirerAskBucketToRestore(sortedBlockBuckets);
    const allObjectsInBucket = await s3Helper.listObjectsOfBucket(selectedBucket);
    const allBlobs = await blobHelpers.getAllBlobs();
    const finalConfirmation = await inquirerFinalConfirmation(selectedBucket, allBlobs.length, allObjectsInBucket.length);

    if (!finalConfirmation) {
      console.log('aborting');

      return;
    }


    await blobHelpers.deleteAllBlobs();

    const objects = await s3Helper.listObjectsOfBucket(selectedBucket);

    await Promise.all(
      objects.map(async (object) => {
        if (object) {
          const objectData = await s3Helper.getObject(selectedBucket, object);
          await blobHelpers.addBlob(object, objectData);
        }
      })
    );

    console.log('-->> Restore done: OVH S3 to Vercel blob data');


  } catch (error) {
    console.log(error);
  }
}