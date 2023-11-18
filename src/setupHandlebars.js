import path from 'path';
import Handlebars from 'handlebars';
import fs from 'fs/promises';

const templatesDir = path.join(__dirname, '../templates');

export default async function SetupHandlebars() {
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

  return templates;
}
