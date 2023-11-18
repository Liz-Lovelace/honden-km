import express from 'express';
import moment from 'moment';
import path from 'path';
import config from '../config.js';
import db from './database.js';
import { startEditor, explainError, getFileContent, applySearch, ensureScratchpadExists } from './utils.js';
import assert from 'node:assert/strict';

function endpoint(fn) {
  return async function(req, res) {
    try {
      const output = await fn.apply(this, [req]);

      if (output.file)
      {res.sendFile(output.file);}
      else if (output.redirect)
      {res.redirect(output.redirect);}
      else
      {res.send(output);}

    } catch (err) {
      res.send(explainError(err));
    }
  };
}

function registerEndpoints(app, templates) {
  app.use(express.urlencoded({ extended: true }));

  app.get('/view', endpoint(async req => {
    const { uuid } = req.query;

    await ensureScratchpadExists();

    const inode = await db.getInode(uuid);
    
    const content = await getFileContent(uuid);

    let linkInodes = await db.getConnectedInodes(uuid);
    linkInodes = linkInodes.map(inode => ({ ...inode, buttonActionDisconnect: true }));

    return templates['index']({ content, inode, linkInodes });
  }));

  app.post('/links', endpoint(async req => {
    const { uuid1, uuid2 } = req.query;
    assert(uuid1 && uuid2, 'you should specify both uuids');

    await db.connect(uuid1, uuid2);

    const inode = await db.getInode(uuid2);
    inode.linkFromUuid = uuid1;

    return templates['entityLink']({ ...inode, buttonActionDisconnect: true });
  }));

  app.delete('/links', endpoint(async req => {
    const { uuid1, uuid2 } = req.query;
    assert(uuid1 && uuid2, 'you should specify both uuids');

    await db.disconnect(uuid1, uuid2);

    return templates['restoreLink']({ uuid1, uuid2 });
  }));

  app.post('/restore_link', endpoint(async req => {
    const { uuid1, uuid2 } = req.query;
    assert(uuid1 && uuid2, 'you should specify both uuids');

    await db.connect(uuid1, uuid2);

    const inode = await db.getInode(uuid2);
    inode.linkFromUuid = uuid1;

    return templates['entityLink']({ ...inode, buttonActionDisconnect: true });
  }));

  app.get('/file', endpoint(async req => {
    const inode = await db.getInode(req.query.uuid);
    const filePath = path.join(config.baseFileStorePath, inode.entity.filename);
    return { file: filePath };
  }));

  app.patch('/rename', endpoint(async req => {
    const { newName } = req.body;
    assert(newName, 'you should specify a new name');
    await db.renameInode(req.query.uuid, newName);
    return 'File renamed successfully';
  }));


  app.delete('/inode', endpoint(async req => {
    await db.deleteInode(req.query.uuid);
    return 'file deleted';
  }));

  let inodeCache;
  let lastInodeCacheTime = 0;
  app.get('/search', endpoint(async req => {
    const { linkFromUuid, search } = req.query;

    if (!search) {
      return '';
    }

    let inodes;
    if (moment() - lastInodeCacheTime > 10000) {
      inodes = await db.getAllInodes();
      inodeCache = inodes;
      lastInodeCacheTime = moment();
    } else {
      inodes = inodeCache;
    }

    return applySearch(search, inodes)
      .map(inode => templates['entityLink']({
        ...inode,
        linkFromUuid,
        buttonActionConnect: true,
      }))
      .reduce((acc, newElem) => acc + newElem, '');
  }));

  app.get('/', endpoint(async req => {
    const allInodes = await db.getAllInodes();
    const foundInode = allInodes.find(inode => inode.entity.filename === 'README');
    
    if (foundInode) {
      return { redirect: `/view?uuid=${foundInode.uuid}` };
    } else {
      return 'Hey, you should really make a note called README';
    }
  }));

  app.put('/edit_note', endpoint(async req => {
    let inode = await db.getInode(req.query.uuid);
    const filePath = path.join(config.baseFileStorePath, inode.entity.filename);
    await startEditor(filePath);
    return 'editing';
  }));

  app.use('/assets', express.static(path.join(__dirname, '../assets')));
}

export { registerEndpoints };

