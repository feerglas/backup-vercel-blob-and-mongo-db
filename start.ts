// todo:
// - send mail on failure
// - cleanup deps

// cron job 1: blob-backup
// get all blob data (vercel) and save to s3 (ovh)
import blobBackup from './jobs/blob-backup.ts';
// blobBackup();



// cron job 2: db-backup
// make db-dump (ovh) and save to s3 (ovh)
import dbBackup from './jobs/db-backup.ts';
// dbBackup('admin');



// cron job 3: backups-cleanup
// delete old blob-backups and db-backups
import backupsCleanup from './jobs/backups-cleanup.ts';
// backupsCleanup();



// disaster recovery script 1: blob-restore
// get blob data backup from s3 (ovh) and save to blob data (vercel)
import blobRestore from './jobs/blob-restore.ts';
blobRestore();



// disaster recovery script 2: db-restore
// get db-backup from s3 (ovh) and save to mongoDb (ovh)
import dbRestore from './jobs/db-restore.ts';
// dbRestore('admin');
