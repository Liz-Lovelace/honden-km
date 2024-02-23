import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import database from '../src/database.js';
import config from '../config.js';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

function extensionToMIME(extension) {
  const mimeTypes = {
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

async function insertFiles() {
  await database.initializeDB();
  try {
    const files = await readdir(path.join(config.baseFileStorePath, 'media'));

    for (const file of files) {
      try {
        const fullPath = path.join(config.baseFileStorePath, 'media', file);
        const fileStat = await stat(fullPath);

        if (fileStat.isFile()) {
          const ext = path.extname(file);

          let uuid = await database.temp(file);
          // await fs.promises.rename(fullPath, path.join(config.baseFileStorePath, 'media', uuid))
          /*
          if (['.md', '.txt', '.note', ''].includes(ext)) {
            await database.insertNote(file);
          } else if (['.jpeg', '.jpg', '.png', '.pdf', '.webm', '.mp4', '.mkv', '.mp3'].includes(ext)) {
            const mimeType = extensionToMIME(ext);
            await database.insertMedia(file, mimeType);
          }
          */
        }
      } catch (error) {
        console.log('Error inserting file:', file, error);
      }
    }
  } catch (error) {
    console.error('Error reading directory:', config.baseFileStorePath, error);
  }
}

insertFiles();

