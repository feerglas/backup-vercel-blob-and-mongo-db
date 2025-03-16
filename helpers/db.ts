import dotenv from 'dotenv';
import{
  Db,
  MongoClient,
  Collection,
} from 'mongodb';

dotenv.config();

export class DbHelper {
  private client: MongoClient;

  constructor() {
    if (process.env.DATABASE_URI) {
      this.client = new MongoClient(process.env.DATABASE_URI);
      this.client.connect();
    }
  }

  public getClient = (): MongoClient => {
    return this.client;
  }

  public getDb = (dbName: string): Db => {
    return this.client.db(dbName);
  }

  // todo: add return type
  public getCollections = async (dbName: string) => {
    const db = this.getDb(dbName);
    const collections = await db.collections();

    return collections;
  }

  // todo: add return type
  public getAllDocumentsOfCollection = async (collection: Collection) => {
    const results = await collection.find({}).toArray();

    return results;
  }

  public deleteCollection = async (dbName, collectionName): Promise<void> => {
    const db = this.getDb(dbName);

    await db.collection(collectionName).drop();

  }

  public deleteAllCollections = async (dbName): Promise<void> => {
    const collections = await this.getCollections(dbName);

    for (const collection of collections) {
      if (!collection.collectionName.startsWith('system.')) {
        await this.deleteCollection(dbName, collection.collectionName);
      }
    }
  }

  public addDocumentsToColletion = async (dbName, collectionName, items): Promise<void> => {
    const db = this.getDb(dbName);

    await db.collection(collectionName).insertMany(items);
  }
}