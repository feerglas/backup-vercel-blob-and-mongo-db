import dotenv from 'dotenv';
import {
  S3Client,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  paginateListObjectsV2,
  paginateListBuckets,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import type {
  Bucket,
  CreateBucketCommandInput,
} from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";

dotenv.config();

export class S3Helper {
  private client;

  constructor() {
    this.client = new S3Client({
      credentials: {
        accessKeyId: process.env.OVH_OS_ACCESS_PUBLIC_KEY || '',
        secretAccessKey: process.env.OVH_OS_ACCESS_PRIVATE_KEY || '',
  
      },
      endpoint: process.env.OVH_OS_IMAGES_BACKUP_CONTAINER_ENDPOINT,
    });
  }

  // BUCKETS

  public createBucket = async (bucketName: string): Promise<void> => {  
    const input: CreateBucketCommandInput = {
      ACL: "private",
      Bucket: bucketName,
    };
  
    const command = new CreateBucketCommand(input);
    await this.client.send(command);
  }

  public deleteBucket = async (bucketName: string): Promise<void> => {
    await this.deleteAllObjects(bucketName);

    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    });

    await this.client.send(command);
  }

  public getAllBuckets = async (): Promise<[(Bucket | undefined)?]> => {
    const buckets: [Bucket?] = [];

    const paginator = paginateListBuckets(
      {
        client: this.client
      },
      {}
    );

    for await (const page of paginator) {
      if (page.Buckets) {
        buckets.push(...page.Buckets);
      }
    }

    return buckets;
  }

  // OBJECTS

  // todo type fileContent
  public addObject = async (bucketName: string, fileName: string, fileContent): Promise<void> => {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent,
      },
      leavePartsOnError: false,
    });
  
    await upload.done();
  }

  public getObject = async (bucketName: string, fileName: string): Promise<string> => {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      }),
    );

    const transformedResult = await response.Body.transformToString();

    return transformedResult;
  }

  public listObjectsOfBucket = async (bucketName: string): Promise<[(string | undefined)?]> => {

    const pageSize = '100';
    const objects: [string?] = [];

    const paginator = paginateListObjectsV2(
      { client: this.client,
        pageSize: Number.parseInt(pageSize)
      },
      { Bucket: bucketName },
    );

    for await (const page of paginator) {
      if (page.Contents) {
        const pageObjects = page.Contents.map((o) => o.Key);
        objects.push(...pageObjects);
      }
    }

    return objects;
  }

  public deleteObject = async (bucketName: string, objectKey: string): Promise<void> => {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    });

    await this.client.send(command);
  }

  public deleteAllObjects = async (bucketName: string): Promise<void> => {
    const objects = await this.listObjectsOfBucket(bucketName);

    await Promise.all(
      objects.map(async (object) => {
        if (object) {
          await this.deleteObject(bucketName, object);
        }
      })
    );
  }
}