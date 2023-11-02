import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import config from '../config.js';
import db from './database.js';
import Fuse from 'fuse.js';

const app = express();
await db.initializeDB();

app.listen(8282, () => {
  console.log(`Server is running on http://localhost:8282`);
});

// db.insertMedia("Should you date Katja Grace-.pdf", "application/pdf")
// db.insertMedia("mshp_graduation_1.jpeg", "image/jpeg")

const templatesDir = path.join(__dirname, '../templates');
const templates = {};

const templateFiles = await fs.readdir(templatesDir);
for (const file of templateFiles) {
  if (file.endsWith('.hbs')) {
    const filePath = path.join(templatesDir, file);
    const templateString = await fs.readFile(filePath, 'utf8');
    Handlebars.registerPartial(file.split('.')[0], templateString);
    templates[file.split('.')[0]] = Handlebars.compile(templateString);
  }
}

Handlebars.registerHelper('iconForType', function(type) {
  const typeIconMapping = {
    note: 'scroll',
    media: 'paperclip-on-paper',
  };
  return typeIconMapping[type];
});

Handlebars.registerHelper('isType', function(inode, type, options) {
  return inode.type === type ? options.fn(this) : options.inverse(this);
});

async function getFileContent(uuid) {
  const inode = await db.getInode(uuid);
  if (!inode) {
    throw new Error(`No file found with UUID: ${uuid}`);
  }
  const filePath = path.join(config.baseFileStorePath, inode.entity.filename);
  const data = await fs.readFile(filePath, 'utf8');
  return data;
}

app.get('/view', async (req, res) => {
  try {
    const { uuid } = req.query;

    const fileContent = await getFileContent(uuid);
    const inode = await db.getInode(uuid);
    let linkInodes = await db.getConnectedInodes(uuid);
    linkInodes = linkInodes.map(inode => ({...inode, buttonActionDisconnect: true}));

    res.send(templates['index']({content: fileContent, inode, linkInodes: linkInodes}));
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/file', async (req, res) => {
  try {
    const { uuid } = req.query;
    const inode = await db.getInode(uuid);
    if (!inode) {
      return res.status(404).send('File not found');
    }

    const filePath = path.join(config.baseFileStorePath, inode.entity.filename);
    res.sendFile(filePath)

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  };
});

app.delete('/inode', async (req, res) => {
  const { uuid } = req.query;

  await db.deleteInode(uuid);
  res.status(204).send("it hath been done");
});

async function startEditor(filePath){
  return Bun.spawn(["alacritty", "-e", "nvim", filePath]);
}

app.put('/edit_note', async (req, res) => {
  const { uuid } = req.query;
  let inode = await db.getInode(uuid)
  const filePath = path.join(config.baseFileStorePath, inode.entity.filename);
  await startEditor(filePath);

  res.send("editing")
});

app.get('/', async (req, res) => {
  const allInodes = await db.getAllInodes();
  const foundInode = allInodes.find(inode => inode.entity.filename === "README.note");
  
  if (foundInode) {
    res.redirect(`/view?uuid=${foundInode.uuid}`);
  } else {
    res.send("Hey, you should really make a note called README")
  }
});

function applySearch(search, inodes) {
  const options = {
    keys: ['entity.filename'], 
    includeScore: true,  
    threshold: 0.3 
  };
  const fuse = new Fuse(inodes, options);

  return fuse.search(search).map(result => result.item);
}

app.get('/search', async (req, res) => {
  const { linkFromUuid, search } = req.query;

  if (!search) {
    res.send('');
    return;
  }

  let inodes = await db.getAllInodes();

  let elements = applySearch(search, inodes)
    .map(inode => templates['entityLink']({
      ...inode,
      linkFromUuid,
      buttonActionConnect: true,
    }))
    .reduce((acc, newElem) => acc + newElem, "");

  res.send(elements);
});

app.post('/links', async (req, res) => {
    const { uuid1, uuid2 } = req.query;

    if (!uuid1 || !uuid2) {
      return res.status(400).send({ message: "Both uuid1 and uuid2 are required" });
    }

    await db.connect(uuid1, uuid2);

    const inode = await db.getInode(uuid2);
    inode.linkFromUuid = uuid1
    res.status(200).send(templates["entityLink"]({...inode, buttonActionDisconnect: true}));
});

app.delete('/links', async (req, res) => {
  const { uuid1, uuid2 } = req.query;

  if (!uuid1 || !uuid2) {
    return res.status(400).send({ message: "Both uuid1 and uuid2 are required" });
  }

  await db.disconnect(uuid1, uuid2);
  res.send(templates["restoreLink"]({uuid1, uuid2}));
});

app.post('/restore_link', async (req, res) => {
    const { uuid1, uuid2 } = req.query;

    if (!uuid1 || !uuid2) {
      return res.status(400).send({ message: "Both uuid1 and uuid2 are required" });
    }

    await db.connect(uuid1, uuid2);

    const inode = await db.getInode(uuid2);
    inode.linkFromUuid = uuid1
    res.status(200).send(templates["entityLink"]({...inode, buttonActionDisconnect: true}));
});

app.use('/assets', express.static(path.join(__dirname, '../assets')));
