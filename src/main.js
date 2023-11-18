import express from 'express';
import db from './database.js';
import { registerEndpoints } from './endpoints.js';
import setupHandlebars from './setupHandlebars.js';

const app = express();

await db.initializeDB();

const templates = await setupHandlebars();

registerEndpoints(app, templates);

app.listen(8282, () => {
  console.log('Honden-km is listening on http://localhost:8282');
});

