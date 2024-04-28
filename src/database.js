import sqlite3 from 'sqlite3';
import assert from 'node:assert/strict';
import uuidGenerator from 'short-uuid';
import { promisify } from 'util';
import config from '../config.js';
import files from './files.js';

const sqliteDB = new sqlite3.Database(config.baseFileStorePath + 'honden.db');
const run = promisify(sqliteDB.run.bind(sqliteDB));
const get = promisify(sqliteDB.get.bind(sqliteDB));
const all = promisify(sqliteDB.all.bind(sqliteDB));

async function closeDB() {
  sqliteDB.close();
}

async function initializeDB() {
  await run(`
    CREATE TABLE IF NOT EXISTS inodes (
      uuid TEXT PRIMARY KEY,
      type TEXT
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS links (
      inode1_uuid TEXT,
      inode2_uuid TEXT,
      FOREIGN KEY(inode1_uuid) REFERENCES inodes(uuid),
      FOREIGN KEY(inode2_uuid) REFERENCES inodes(uuid)
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS note (
      uuid TEXT PRIMARY KEY,
      filename TEXT,
      contents TEXT,
      FOREIGN KEY(uuid) REFERENCES inodes(uuid)
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS media (
      uuid TEXT PRIMARY KEY,
      filename TEXT,
      filetype TEXT,
      FOREIGN KEY(uuid) REFERENCES inodes(uuid)
    );
  `);
}


// Inode stuff
async function insertInode(uuid, type) {
  await run('INSERT OR IGNORE INTO inodes (uuid, type) VALUES (?, ?)', uuid, type);
}

async function getInode(uuid) {
  let inode = await get('SELECT * FROM inodes WHERE uuid = ?', uuid);
  assert(inode, `can't find inode with uuid ${uuid}`);

  let entity = await get(`SELECT * FROM ${inode.type} WHERE uuid = ?`, uuid);
  assert(entity, `can't find entity with uuid ${uuid}`);

  return { ...inode, entity };
}

async function getConnectedInodes(uuid) {
  let inodes = await all(`
    SELECT inode2_uuid AS uuid FROM links WHERE inode1_uuid = ? 
    UNION 
    SELECT inode1_uuid AS uuid FROM links WHERE inode2_uuid = ?
  `, uuid, uuid);

  let entities = inodes.map(inode => getInode(inode.uuid));
  entities = await Promise.all(entities);
  entities = entities.map(inode => ({ ...inode, linkFromUuid: uuid }));

  return entities;
}

async function getAllInodes() {
  let inodes = await all('SELECT * FROM inodes');
  inodes = inodes.map(inode => getInode(inode.uuid));
  return Promise.all(inodes);
}

async function renameInode(uuid, newFilename) {
  const inode = await getInode(uuid);
  if (!['media', 'note'].includes(inode.type)) {
    console.log('RENAME ERROR: inode type unsupported');
    return;
  }
  await run(`UPDATE ${inode.type} SET filename = ? WHERE uuid = ?`, newFilename, uuid);
}

async function deleteInode(uuid) {
  const inode = await getInode(uuid);

  await run('BEGIN TRANSACTION');

  try {
    await run('DELETE FROM links WHERE inode1_uuid = ? OR inode2_uuid = ?', uuid, uuid);

    if (inode.type === 'media') {
      await files.deleteMedia(uuid);
    }

    await run(`DELETE FROM ${inode.type} WHERE uuid = ?`, uuid);
    await run('DELETE FROM inodes WHERE uuid = ?', uuid);

    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}


// Link stuff
async function connect(uuid1, uuid2) {
  if (uuid1 === uuid2) {
    console.log('LINK CONNECTION ERROR: inodes are identical');
    return;
  }

  if (uuid1 > uuid2) {
    [uuid1, uuid2] = [uuid2, uuid1];
  }

  const existingLink = await get('SELECT 1 FROM links WHERE inode1_uuid = ? AND inode2_uuid = ?', uuid1, uuid2);

  if (existingLink) {
    console.log('LINK CONNECTION ERROR: link already exists');
    return;
  }

  await run('INSERT INTO links (inode1_uuid, inode2_uuid) VALUES (?, ?)', uuid1, uuid2);
}

async function disconnect(uuid1, uuid2) {
  if (uuid1 > uuid2) {
    [uuid1, uuid2] = [uuid2, uuid1];
  }

  await run('DELETE FROM links WHERE inode1_uuid = ? AND inode2_uuid = ?', uuid1, uuid2);
}


// Note stuff
async function getNoteContents(uuid) {
  const note = await get('SELECT contents FROM note WHERE uuid = ?', uuid);
  return note ? note.contents : null;
}

async function updateNoteContents(uuid, contents) {
  await run('UPDATE note SET contents = ? WHERE uuid = ?', contents, uuid);
}

async function insertNote(filename) {
  const uuid = uuidGenerator.generate();
  await run('INSERT INTO note (uuid, filename) VALUES (?, ?)', uuid, filename);
  await insertInode(uuid, 'note');
  return uuid;
}


// Media stuff
async function insertMedia(filename, filetype) {
  const uuid = uuidGenerator.generate();
  await run('INSERT INTO media (uuid, filename, filetype) VALUES (?, ?, ?)', uuid, filename, filetype);
  await insertInode(uuid, 'media');
  return uuid;
}

export default {
  closeDB,
  initializeDB,
  getInode,
  insertInode,
  insertNote,
  insertMedia,
  connect,
  disconnect,
  getConnectedInodes,
  getAllInodes,
  deleteInode,
  renameInode,
  getNoteContents,
  updateNoteContents,
};