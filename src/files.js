import fs from 'fs/promises';
import path from 'path';
import db from './database.js';
import config from '../config.js';

async function pullNote(uuid) {
  const contents = await db.getNoteContents(uuid);
  const filePath = localNotePath(uuid);
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, contents, { flag: 'wx' });
  }
  return filePath;
}

async function pushNote(uuid) {
  const filePath = localNotePath(uuid);
  const fileContents = await fs.readFile(filePath, 'utf8');

  await db.updateNoteContents(uuid, fileContents);

  const updatedContents = await db.getNoteContents(uuid);
  if (updatedContents !== fileContents) {
    throw new Error('Contents do not match after update');
  }

  await fs.unlink(filePath);
}

async function deleteMedia(uuid) {
  return fs.unlink(mediaURL(uuid));
}

function localNotePath(uuid) {
  return path.join(config.baseFileStorePath, 'open-notes', uuid);
}

function mediaURL(uuid) {
  return path.join(config.baseFileStorePath, 'media', uuid);
}

export default { pullNote, pushNote, localNotePath, mediaURL, deleteMedia };
