/**
 * IDBWrapper — a zero-dependency, Promise-based IndexedDB wrapper.
 *
 * Usage:
 *   const db = new IDBWrapper('MyDB', 1);
 *   await db.open();
 *   const stores = db.getObjectStores();
 *   const rows   = await db.getAll('myStore');
 */

export default class IDBWrapper {
  /** @param {string} dbName  @param {number} version */
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    /** @type {IDBDatabase|null} */
    this.db = null;
  }

  /* ─── lifecycle ──────────────────────────────────────── */

  /** Open (or upgrade) the database. Resolves with `this`. */
  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        // nothing else — stores are created via createObjectStore()
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.version = this.db.version;
        resolve(this);
      };

      request.onerror = (event) => {
        reject(event.target.error || new Error(`IDB open failed: ${event.target.error?.message}`));
      };

      request.onblocked = () => {
        reject(new Error('Database is blocked. Close other tabs using this database and try again.'));
      };
    });
  }

  /** Close the current connection. */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /* ─── schema helpers ────────────────────────────────── */

  /** Returns an array of object-store name strings. */
  getObjectStores() {
    if (!this.db) return [];
    return Array.from(this.db.objectStoreNames);
  }

  /**
   * Read keyPath / autoIncrement for an object store.
   * @param {string} storeName
   * @returns {{ keyPath: string|null, autoIncrement: boolean }}
   */
  getObjectStoreInfo(storeName) {
    if (!this.db) return { keyPath: null, autoIncrement: false };
    try {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      return { keyPath: store.keyPath ?? null, autoIncrement: store.autoIncrement };
    } catch {
      return { keyPath: null, autoIncrement: false };
    }
  }

  /**
   * Create a new object store.
   * Requires closing and re-opening with an incremented version.
   * @param {string} storeName
   * @param {{ keyPath?: string|null, autoIncrement?: boolean }} options
   */
  createObjectStore(storeName, options = {}) {
    const { keyPath = 'id', autoIncrement = false } = options;

    const currentVersion = this.db?.version ?? this.version;
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    const newVersion = currentVersion + 1;
    this.version = newVersion;

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, newVersion);

      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, {
            keyPath: autoIncrement ? null : (keyPath || 'id'),
            autoIncrement,
          });
        }
      };

      req.onsuccess = (event) => {
        this.db = event.target.result;
        this.version = this.db.version;
        resolve(this);
      };

      req.onerror = (event) => {
        reject(event.target.error || new Error(`createObjectStore failed: ${event.target.error?.message}`));
      };

      req.onblocked = () => {
        reject(new Error('Database blocked. Close other tabs and try again.'));
      };
    });
  }

  /**
   * Delete an object store.
   * Requires closing and re-opening with an incremented version.
   * @param {string} storeName
   */
  deleteObjectStore(storeName) {
    const currentVersion = this.db?.version ?? this.version;
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    const newVersion = currentVersion + 1;
    this.version = newVersion;

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, newVersion);

      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (db.objectStoreNames.contains(storeName)) {
          db.deleteObjectStore(storeName);
        }
      };

      req.onsuccess = (event) => {
        this.db = event.target.result;
        this.version = this.db.version;
        resolve(this);
      };

      req.onerror = (event) => {
        reject(event.target.error || new Error(`deleteObjectStore failed: ${event.target.error?.message}`));
      };

      req.onblocked = () => {
        reject(new Error('Database is blocked. Close other tabs using this database and try again.'));
      };
    });
  }

  /* ─── read helpers ──────────────────────────────────── */

  /**
   * Get all records from a store.
   * @param {string} storeName
   * @returns {Promise<any[]>}
   */
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not open'));
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(new Error(`getAll failed: ${e.target.error?.message}`));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get the record count for a store.
   * @param {string} storeName
   * @returns {Promise<number>}
   */
  getCount(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not open'));
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(new Error(`getCount failed: ${e.target.error?.message}`));
      } catch (err) {
        reject(err);
      }
    });
  }

  /* ─── write helpers ─────────────────────────────────── */

  /**
   * Upsert a record (insert or update).
   * @param {string} storeName
   * @param {object} record
   * @returns {Promise<IDBValidKey>} the key of the written record
   */
  put(storeName, record) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not open'));
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(record);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(new Error(`put failed: ${e.target.error?.message}`));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Delete a record by primary key.
   * @param {string} storeName
   * @param {IDBValidKey} id
   */
  delete(storeName, id) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not open'));
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(new Error(`delete failed: ${e.target.error?.message}`));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Clear all records in a store.
   * @param {string} storeName
   */
  clear(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not open'));
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(new Error(`clear failed: ${e.target.error?.message}`));
      } catch (err) {
        reject(err);
      }
    });
  }
}
