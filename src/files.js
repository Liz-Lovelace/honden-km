import config from './config.js';
import fs from 'fs/promises';

function formatSize(size) {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

function formatDate(epoch) {
  const daysDiff = (Date.now() - epoch) / (1000 * 60 * 60 * 24);
  const date = new Date(epoch);
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()} (${Math.floor(daysDiff)} days ago)`;
}

async function getFileInfo(path) {
  path = config.baseFileStorePath + path;
  let attributes;
  try {
    attributes = await fs.stat(path);
  } catch {
    return null;
  }
  
  const sizeFormatted = formatSize(attributes.size);
  const atimeFormatted = formatDate(attributes.atimeMs);
  const mtimeFormatted = formatDate(attributes.mtimeMs);
  const ctimeFormatted = formatDate(attributes.ctimeMs);

  return {
    size: sizeFormatted,
    atime: atimeFormatted,
    mtime: mtimeFormatted,
    ctime: ctimeFormatted
  };
}

export default {getFileInfo, formatSize, formatDate}
