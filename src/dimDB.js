import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { log } from './logger.js';
import config from './config.js';

const sqliteDB = new sqlite3.Database(config.baseFileStorePath + "dim.db");
sqliteDB.run = promisify(sqliteDB.run.bind(sqliteDB));
sqliteDB.get = promisify(sqliteDB.get.bind(sqliteDB));
sqliteDB.all = promisify(sqliteDB.all.bind(sqliteDB));

async function closeDB() {
  sqliteDB.close();
}

async function initializeDB() {
  await sqliteDB.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY,
      filename TEXT UNIQUE
    );
  `);
  await sqliteDB.run(`
    CREATE TABLE IF NOT EXISTS links (
      file1_id INTEGER,
      file2_id INTEGER,
      FOREIGN KEY(file1_id) REFERENCES files(id),
      FOREIGN KEY(file2_id) REFERENCES files(id)
    );
  `);
}

async function getFileID(filename) {
  const row = await sqliteDB.get("SELECT id FROM files WHERE filename = ?", filename);
  return row ? row.id : null;
}

async function insertFile(filename) {
  await sqliteDB.run("INSERT OR IGNORE INTO files (filename) VALUES (?)", filename);
}

async function connect(file1, file2) {
  if (file1 === file2) {
    log("LINK CONNECTION ERROR: files are identical");
    return;
  }

  await insertFile(file1);
  await insertFile(file2);

  const file1_id = await getFileID(file1);
  const file2_id = await getFileID(file2);

  if (file1_id > file2_id) {
    [file1_id, file2_id] = [file2_id, file1_id];
  }

  const existingLink = await sqliteDB.get("SELECT 1 FROM links WHERE file1_id = ? AND file2_id = ?", file1_id, file2_id);

  if (existingLink) {
    log("LINK CONNECTION ERROR: link already exists");
    return;
  }

  await sqliteDB.run("INSERT INTO links (file1_id, file2_id) VALUES (?, ?)", file1_id, file2_id);
}

async function disconnect(file1, file2) {
  const file1_id = await getFileID(file1);
  const file2_id = await getFileID(file2);

  if (!file1_id || !file2_id) {
    log("LINK DISCONNECTION ERROR: one of the files not found");
    return;
  }

  if (file1_id > file2_id) {
    [file1_id, file2_id] = [file2_id, file1_id];
  }

  await sqliteDB.run("DELETE FROM links WHERE file1_id = ? AND file2_id = ?", file1_id, file2_id);
}

async function connectedFiles(file) {
  const file_id = await getFileID(file);

  if (!file_id) {
    return [];
  }

  const rows = await sqliteDB.all(`
    SELECT filename FROM files 
    JOIN links ON id = file1_id WHERE file2_id = ? 
    UNION 
    SELECT filename FROM files 
    JOIN links ON id = file2_id WHERE file1_id = ?
  `, file_id, file_id);

  return rows.map(row => row.filename);
}

export default {
  closeDB,
  initializeDB,
  getFileID,
  insertFile,
  connect,
  disconnect,
  connectedFiles
};

