import dotenv from 'dotenv';
import{ MongoClient } from 'mongodb';

dotenv.config();

export class DbHelper {
  client;

  constructor() {
    this.client = new MongoClient(process.env.DATABASE_URI);
    this.client.connect();
  }

  getClient = () => {
    return this.client;
  }

  getDb = (dbName) => {
    return this.client.db(dbName);
  }

  getCollections = async (dbName) => {
    const db = this.getDb(dbName);
    const collections = await db.collections();

    return collections;
  }

  getAllDocumentsOfCollection = async (collection) => {
    const results = await collection.find({}).toArray();

    return results;
  }

  deleteCollection = async (dbName, collectionName) => {
    const db = this.getDb(dbName);

    await db.collection(collectionName).drop();

  }

  deleteAllCollections = async (dbName) => {
    const collections = await this.getCollections(dbName);

    for (const collection of collections) {
      if (!collection.collectionName.startsWith('system.')) {
        await this.deleteCollection(dbName, collection.collectionName);
      }
    }
  }

  addDocumentsToColletion = async (dbName, collectionName, items) => {
    const db = this.getDb(dbName);

    await db.collection(collectionName).insertMany(items);
  }
}