/**
 * IndexedDB-backed file storage for Kaoto Web.
 *
 * Provides a virtual filesystem where each "file" is a YAML route
 * identified by its filename (e.g. "timer-to-log.camel.yaml").
 *
 * Uses the `idb` library for a promise-based IndexedDB wrapper.
 */
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'kaoto-web';
const DB_VERSION = 1;
const FILES_STORE = 'files';

export interface StoredFile {
  /** The filename, used as primary key (e.g. "my-route.camel.yaml") */
  filename: string;
  /** The YAML content */
  content: string;
  /** Last modified timestamp */
  updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | undefined;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE, { keyPath: 'filename' });
        }
      },
    });
  }
  return dbPromise;
}

/** Save (create or overwrite) a file. */
export async function saveFile(filename: string, content: string): Promise<void> {
  const db = await getDb();
  const record: StoredFile = { filename, content, updatedAt: Date.now() };
  await db.put(FILES_STORE, record);
}

/** Read a file's content. Returns undefined if not found. */
export async function readFile(filename: string): Promise<string | undefined> {
  const db = await getDb();
  const record: StoredFile | undefined = await db.get(FILES_STORE, filename);
  return record?.content;
}

/** Delete a file. */
export async function deleteFile(filename: string): Promise<void> {
  const db = await getDb();
  await db.delete(FILES_STORE, filename);
}

/** List all stored files, sorted by most recently updated. */
export async function listFiles(): Promise<StoredFile[]> {
  const db = await getDb();
  const all: StoredFile[] = await db.getAll(FILES_STORE);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
