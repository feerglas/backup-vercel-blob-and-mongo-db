import boxen from 'boxen';
import chalk from 'chalk';
import type { Bucket } from '@aws-sdk/client-s3';
import * as blobHelpers from '../helpers/blob.ts';
import { S3Helper } from '../helpers/s3.ts';
import config from '../config.ts';
import { sortBucketsNewestFirst } from "../helpers/date.ts";
import inquirer from 'inquirer';

const inquirerAskForProceed = async (): Promise<Boolean> => {
  console.log(boxen(`Restore blob storage from S3 to Vercel. ${chalk.red('This is a destructive process. All data from Vercel Blob will be deleted in order to restore the data from the S3 Backup')}`, {padding: 1}));

  const answerNo = 'No';
  const answers = await inquirer.prompt(
    [
      {
        type: 'list',
        name: 'proceed',
        message: 'Are you sure you want to continue?',
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