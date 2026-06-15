/**
 * IndexedDB admin helpers — delete database, list databases.
 */

export function deleteDatabase(dbName, connectionToClose = null) {
  return new Promise((resolve, reject) => {
    if (connectionToClose && connectionToClose.dbName === dbName) {
      connectionToClose.close();
    }

    const req = indexedDB.deleteDatabase(dbName);

    req.onsuccess = () => resolve();

    req.onerror = (e) => {
      reject(e.target.error || new Error(`Failed to delete database "${dbName}"`));
    };

    req.onblocked = () => {
      reject(new Error(`Database "${dbName}" is open in another tab. Close all other tabs and try again.`));
    };
  });
}

export async function listOriginDatabases() {
  if (typeof indexedDB.databases !== 'function') return [];
  try {
    return await indexedDB.databases();
  } catch {
    return [];
  }
}
