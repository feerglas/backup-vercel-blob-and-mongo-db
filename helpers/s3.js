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
import { Upload } from "@aws-sdk/lib-storage";

dotenv.config();

export class S3Helper {
  client;

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

  createBucket = async (bucketName) => {  
    const input = {
      ACL: "private",
      Bucket: bucketName,
    };
  
    const command = new CreateBucketCommand(input);
    await this.client.send(command);
  }

  deleteBucket = async (bucketName) => {
    await this.deleteAllObjects(bucketName);

    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    });

    await this.client.send(command);
  }

  getAllBuckets = async () => {
    const buckets = [];

    const paginator = paginateListBuckets(
      {
        client: this.client
      },
      {}
    );

    for await (const page of paginator) {
      buckets.push(...page.Buckets);
    }

    return buckets;
  }

  // OBJECTS

  addObject = async (bucketName, fileName, fileContent) => {
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

  getObject = async (bucketName, fileName) => {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      }),
    );

    const transformedResult = await response.Body.transformToString();

    return transformedResult;
  }

  listObjectsOfBucket = async (bucketName) => {

    const pageSize = 100;
    const objects = [];

    const paginator = paginateListObjectsV2(
      { client: this.client,
        pageSize: Number.parseInt(pageSize)
      },
      { Bucket: bucketName },
    );

    for await (const page of paginator) {
      if (page.Contents) {
        objects.push(page.Contents.map((o) => o.Key));
      }
    }

    let allObjects = [];

    objects.forEach((objectList) => {
      allObjects = allObjects.concat(objectList);
    });

    return allObjects;
  }

  deleteObject = async (bucketName, objectKey) => {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    });

    await this.client.send(command);
  }

  deleteAllObjects = async (bucketName) => {
    const objects = await this.listObjectsOfBucket(bucketName);
    const promises = [];

    objects.forEach((object) => {
      promises.push(this.deleteObject(bucketName, object));
    })

    await Promise.all(promises);
  }
}