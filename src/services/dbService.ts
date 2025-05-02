import { RootDatabase, open } from 'lmdb'

class LMDBInstance {
  private static _instance: LMDBInstance
  private db: RootDatabase

  private constructor() {
    this.db = open({
      path: 'database/',
      maxReaders: 100,
      mapSize: 2 * 1024 * 1024 * 1024 // 2GB
    })
  }

  // Static method to get the singleton instance
  public static getInstance(): LMDBInstance {
    if (!LMDBInstance._instance) {
      LMDBInstance._instance = new LMDBInstance()
    }
    return LMDBInstance._instance
  }

  // Getter for the database instance
  public getDB(): RootDatabase {
    return this.db
  }
}

export default function getDb(): RootDatabase {
  return LMDBInstance.getInstance().getDB()
}
