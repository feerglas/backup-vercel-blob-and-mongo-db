import inquirer from 'inquirer';
import boxen from 'boxen';
import type { Bucket } from '@aws-sdk/client-s3';

export const inquirerAskForProceed = async (message: string): Promise<Boolean> => {
  console.log(boxen(message, {padding: 1}));

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

export const inquirerAskBucketToRestore = async (buckets: Bucket[]): Promise<string> => {

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