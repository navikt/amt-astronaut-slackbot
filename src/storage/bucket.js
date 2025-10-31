const { Storage } = require('@google-cloud/storage');

class BucketStorage {
  constructor(opts = {}) {
    const bucketName = process.env.NAIS_BUCKETS_AMT_ASTRONAUT_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('Missing NAIS_BUCKETS_AMT_ASTRONAUT_BUCKET_NAME');
    }
    const objectName = process.env.BUCKET_OBJECT || 'state.json';

    const StorageImpl = opts.Storage || Storage;
    const storage = new StorageImpl();
    this.file = storage.bucket(bucketName).file(objectName);
  }

  static initialState() {
    return { roster: [], remaining: [], current: null, paused: false, lastPickAt: null };
  }

  async init() {
    const [exists] = await this.file.exists();
    if (!exists) {
      await this.file.save(JSON.stringify(BucketStorage.initialState()), { contentType: 'application/json' });
    }
  }

  async getState() {
    try {
      const [contents] = await this.file.download();
      return JSON.parse(contents.toString('utf8'));
    } catch (err) {
      if (err && err.code === 404) {
        const initial = BucketStorage.initialState();
        await this.file.save(JSON.stringify(initial), { contentType: 'application/json' });
        return initial;
      }
      throw err;
    }
  }

  async setState(newState) {
    await this.file.save(JSON.stringify(newState), { contentType: 'application/json' });
    return newState;
  }

  async close() {}
}

module.exports = { BucketStorage };
