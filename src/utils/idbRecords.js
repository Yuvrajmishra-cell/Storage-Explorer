/** Normalize IDB records for table display (primitives → { value }) */
export function normalizeIdbRecord(record) {
  if (record !== null && typeof record === 'object' && !Array.isArray(record)) {
    return record;
  }
  return { value: record };
}

export function normalizeIdbRecords(records) {
  return (records || []).map(normalizeIdbRecord);
}

/** Collect unique column keys from normalized record objects */
export function generateColumns(records) {
  if (!records || records.length === 0) return [];
  const allKeys = new Set();
  records.forEach((record) => {
    if (typeof record === 'object' && record !== null) {
      Object.keys(record).forEach((key) => allKeys.add(key));
    }
  });
  return Array.from(allKeys);
}

export function recordHasKeyField(record, keyPath, autoIncrement) {
  if (autoIncrement || !keyPath) return true;
  return record[keyPath] !== undefined && record[keyPath] !== null;
}

export async function getNextKeyValue(dbConnection, storeName, keyPath, autoIncrement, records) {
  const rows = records ?? (await dbConnection.getAll(storeName));
  if (autoIncrement || !keyPath) {
    return rows.length + 1;
  }
  if (rows.length === 0) {
    if (keyPath === '_id') return 'abc123';
    if (keyPath === 'id') return 1;
    return 1;
  }
  const normalized = normalizeIdbRecords(rows);
  const numericIds = normalized.map((r) => Number(r[keyPath])).filter((n) => !Number.isNaN(n));
  if (numericIds.length > 0) {
    return Math.max(...numericIds) + 1;
  }
  return rows.length + 1;
}

export async function buildRecordTemplate(dbConnection, storeName, storeInfo, records) {
  const { keyPath, autoIncrement } = storeInfo;

  if (autoIncrement || !keyPath) {
    return '{\n  "name": "example"\n}';
  }

  const nextVal = await getNextKeyValue(dbConnection, storeName, keyPath, autoIncrement, records);
  let sample;
  if (keyPath === '_id') {
    sample = JSON.stringify(typeof nextVal === 'number' ? `abc${nextVal}` : String(nextVal));
  } else if (typeof nextVal === 'number') {
    sample = String(nextVal);
  } else {
    sample = JSON.stringify(String(nextVal));
  }

  return `{\n  "${keyPath}": ${sample},\n  "name": "example"\n}`;
}
