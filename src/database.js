import sqlite3 from 'sqlite3';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs/promises';
import uuidGenerator from 'short-uuid';
import { promisify } from 'util';
import config from '../config.js';

const sqliteDB = new sqlite3.Database(config.baseFileStorePath + 'honden.db');
sqliteDB.run = promisify(sqliteDB.run.bind(sqliteDB));
sqliteDB.get = promisify(sqliteDB.get.bind(sqliteDB));
sqliteDB.all = promisify(sqliteDB.all.bind(sqliteDB));

async function closeDB() {
  sqliteDB.close();
}

async function initializeDB() {
  await sqliteDB.run(`
    CREATE TABLE IF NOT EXISTS inodes (
      uuid TEXT PRIMARY KEY,
      type TEXT
    );
  `);
  await sqliteDB.run(`
    CREATE TABLE IF NOT EXISTS links (
      inode1_uuid TEXT,
      inode2_uuid TEXT,
      FOREIGN KEY(inode1_uuid) REFERENCES inodes(uuid),
      FOREIGN KEY(inode2_uuid) REFERENCES inodes(uuid)
    );
  `);
  await sqliteDB.run(`
    CREATE TABLE IF NOT EXISTS note (
      uuid TEXT PRIMARY KEY,
      filename TEXT UNIQUE,
      FOREIGN KEY(uuid) REFERENCES inodes(uuid)
    );
  `);
  await sqliteDB.run(`
    CREATE TABLE IF NOT EXISTS media (
      uuid TEXT PRIMARY KEY,
      filename TEXT UNIQUE,
      filetype TEXT,
      FOREIGN KEY(uuid) REFERENCES inodes(uuid)
    );
  `);
}
async function getInode(uuid) {
  let inode = await sqliteDB.get('SELECT * FROM inodes WHERE uuid = ?', uuid);
  assert(inode, `can't find inode with uuid ${uuid}`);

  let entity = await sqliteDB.get(`SELECT * FROM ${inode.type} WHERE uuid = ?`, uuid);
  assert(entity, `can't find entity with uuid ${uuid}`);

  return { ...inode, entity };
}

async function insertNote(filename) {
  const uuid = uuidGenerator.generate();
  await insertInode(uuid, 'note');
  await sqliteDB.run('INSERT INTO note (uuid, filename) VALUES (?, ?)', uuid, filename);
  return uuid;
}

async function insertMedia(filename, filetype) {
  const uuid = uuidGenerator.generate();
  await insertInode(uuid, 'media');
  await sqliteDB.run('INSERT INTO media (uuid, filename, filetype) VALUES (?, ?, ?)', uuid, filename, filetype);
  return uuid;
}

async function insertInode(uuid, type) {
  await sqliteDB.run('INSERT OR IGNORE INTO inodes (uuid, type) VALUES (?, ?)', uuid, type);
}

async function deleteInode(uuid) {
  const inode = await getInode(uuid);

  await sqliteDB.run('BEGIN TRANSACTION');

  try {
    await sqliteDB.run('DELETE FROM links WHERE inode1_uuid = ? OR inode2_uuid = ?', uuid, uuid);

    if (inode.type === 'media' || inode.type === 'note') {
      const entity = await sqliteDB.get(`SELECT * FROM ${inode.type} WHERE uuid = ?`, uuid);
      const filePath = path.join(config.baseFileStorePath, entity.filename);
      await fs.unlink(filePath);
      await sqliteDB.run(`DELETE FROM ${inode.type} WHERE uuid = ?`, uuid);
    }

    await sqliteDB.run('DELETE FROM inodes WHERE uuid = ?', uuid);
    await sqliteDB.run('COMMIT');
  } catch (error) {
    await sqliteDB.run('ROLLBACK');
    throw error;
  }
}

async function renameInode(uuid, newFilename) {
  const inode = await getInode(uuid);

  const existingEntity = await sqliteDB.get(`
    SELECT 1 FROM note WHERE filename = ? 
    UNION 
    SELECT 1 FROM media WHERE filename = ?
  `, newFilename, newFilename);

  if (existingEntity) {
    throw new Error('A file with this name already exists');
  }

  const oldFilePath = path.join(config.baseFileStorePath, inode.entity.filename);
  const newFilePath = path.join(config.baseFileStorePath, newFilename);

  await sqliteDB.run(`UPDATE ${inode.type} SET filename = ? WHERE uuid = ?`, newFilename, uuid);
  await fs.rename(oldFilePath, newFilePath);
}
async function connect(uuid1, uuid2) {
  if (uuid1 === uuid2) {
    console.log('LINK CONNECTION ERROR: inodes are identical');
    return;
  }

  if (uuid1 > uuid2) {
    [uuid1, uuid2] = [uuid2, uuid1];
  }

  const existingLink = await sqliteDB.get('SELECT 1 FROM links WHERE inode1_uuid = ? AND inode2_uuid = ?', uuid1, uuid2);

  if (existingLink) {
    console.log('LINK CONNECTION ERROR: link already exists');
    return;
  }

  await sqliteDB.run('INSERT INTO links (inode1_uuid, inode2_uuid) VALUES (?, ?)', uuid1, uuid2);
}

async function disconnect(uuid1, uuid2) {
  if (uuid1 > uuid2) {
    [uuid1, uuid2] = [uuid2, uuid1];
  }

  await sqliteDB.run('DELETE FROM links WHERE inode1_uuid = ? AND inode2_uuid = ?', uuid1, uuid2);
}

async function getConnectedInodes(uuid) {
  let inodes = await sqliteDB.all(`
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
  let inodes = await sqliteDB.all('SELECT * FROM inodes');
  inodes = inodes.map(inode => getInode(inode.uuid));
  return Promise.all(inodes);
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
};

