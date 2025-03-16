// todo:
// - send mail on failure

// cron job 1: blob-backup
// get all blob data (vercel) and save to s3 (ovh)
import blobBackup from './jobs/blob-backup.js';
// blobBackup();



// cron job 2: db-backup
// make db-dump (ovh) and save to s3 (ovh)
import dbBackup from './jobs/db-backup.js';
// dbBackup('admin');



// cron job 3: backups-cleanup
// delete old blob-backups and db-backups
import backupsCleanup from './jobs/backups-cleanup.js';
// backupsCleanup();



// disaster recovery script 1: blob-restore
// get blob data backup from s3 (ovh) and save to blob data (vercel)
import blobRestore from './jobs/blob-restore.js';
// blobRestore();



// disaster recovery script 2: db-restore
// get db-backup from s3 (ovh) and save to mongoDb (ovh)
import dbRestore from './jobs/db-restore.js';
dbRestore('admin');















/*
// list all files of s3 bucket
// and then
// restore s3 json files to db collection

import{ MongoClient } from 'mongodb';

const restoreS3JsonToCollection = async () => {
  const objects = await listObjectsOfBucket();

  const bucketName = 'mongodbbackup';
  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.OVH_OS_ACCESS_PUBLIC_KEY || '',
      secretAccessKey: process.env.OVH_OS_ACCESS_PRIVATE_KEY || '',

    },
    endpoint: process.env.OVH_OS_IMAGES_BACKUP_CONTAINER_ENDPOINT,
  });

  const mongoClient = new MongoClient(process.env.DATABASE_URI);
  await mongoClient.connect();
  const db = mongoClient.db('admin');

  for (const s3Object of objects) {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Object,
      }),
    );

    const str = await response.Body.transformToString();
    
    const collectionNameSplit = s3Object.split('.json');
    
    if (collectionNameSplit.length === 2) {
      const [collectionName] = collectionNameSplit;

      await db.collection(collectionName).drop();

      const parsed = JSON.parse(str);
      if (parsed.length > 0) {

        
        await db.collection(collectionName).insertMany(JSON.parse(str));
      }
      
    }
  }

  mongoClient.close();
}

try {
  restoreS3JsonToCollection();
} catch(err) {
  console.log(err);
}

*/

