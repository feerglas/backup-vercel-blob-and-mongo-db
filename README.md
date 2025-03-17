# Backup and Restore Vercel Blob Data and MongoDB collections

Helpers for various tasks concerning backup and restore of Vercel blob data and MongoDB to S3.

## Run locally

To run the jobs locally, make sure to copy `.env.example` to `.env` and fill in the corresponding values for the variables.

## Jobs

These jobs are available as npm scripts.

Ideally, blob backup, db backup und backups cleanup should be run as cron jobs on a regular basis.

Restore blob and restore db are meant to be executed on demand and triggered locally.

### cron job 1: blob backup

`npm run backup:blob`

get all blob data (vercel) and save to s3 (ovh)
./jobs/blob-backup.ts


### cron job 2: db backup

`npm run backup:db`

make db-dump (ovh) and save to s3 (ovh)
./jobs/db-backup.ts


### cron job 3: backups cleanup

`npm run backup:cleanup`

delete old blob-backups and db-backups
./jobs/backups-cleanup.ts


### disaster recovery script 1: blob restore

`npm run restore:blob`

get blob data backup from s3 (ovh) and save to blob data (vercel)
./jobs/blob-restore.ts


### disaster recovery script 2: db restore

`npm run restore:db`

get db-backup from s3 (ovh) and save to mongoDb (ovh)
./jobs/db-restore.ts

## Todo
- Send mail on failure