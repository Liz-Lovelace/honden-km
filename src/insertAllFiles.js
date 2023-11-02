import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import database from './database.js'; // Replace with the correct path to your database module
import config from '../config.js';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function insertFiles() {
  try {
    const files = await readdir(config.baseFileStorePath);

    for (const file of files) {
      try {
        const fullPath = path.join(config.baseFileStorePath, file);
        const fileStat = await stat(fullPath);

        if (fileStat.isFile()) {
          const ext = path.extname(file).toLowerCase();

          // Insert files with .md, .txt, .note extensions or extensionless files
          if (['.md', '.txt', '.note', ''].includes(ext)) {
            await database.insertNote(file);
          }
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

