import state from './state.js';
import layout from './layout.js';
import {log, getLog} from './logger.js';
import files from './files.js';
import editor from './editor.js';

let r;
let font;

async function drawEditor() {
  const pane_output = await editor.grab_output();
  if (!pane_output.content) return;

  const box = layout.getBox("content").inset(10);
  const cursorColor = r.GetColor(0x00ff00ff); 
  
  r.DrawRectangle(
    box.x1 + pane_output.cursor.x * state.get().font.width,
    box.y1 + pane_output.cursor.y * state.get().font.height,
    state.get().font.width,
    state.get().font.height,
    cursorColor
  );

  textInBox(box, pane_output.content, r.GetColor(0x00ff00ff));
}

async function debug() {
  const box = layout.getBox("debug").inset(10);
  const info = await files.getFileInfo(state.get().fileA);
  let y = box.y1 + 10;

  text(`FILEINFO ${state.get().fileA}`, r.GetColor(0x00ff00ff), box.x1 + 30, y);
  y += state.get().font.height * 2;

  if (info) {
    text(`size  ${info.size}`, r.GetColor(0x00ff00ff), box.x1, y);
    y += state.get().font.height * 1.5;

    text(`atime ${info.atime}`, r.GetColor(0x00ff00ff), box.x1, y);
    y += state.get().font.height;

    text(`mtime ${info.mtime}`, r.GetColor(0x00ff00ff), box.x1, y);
    y += state.get().font.height;

    text(`ctime ${info.ctime}`, r.GetColor(0x00ff00ff), box.x1, y);
    y += state.get().font.height;
  }
}

function drawLog() {
  const box = layout.getBox("log").inset(10);
  const text = getLog();
  
  textInBox(box, text, r.GetColor(0xFF0000FF));
}

function extraText() {
  const box = layout.getBox("extraText").inset(20);
  const text = "MANUAL:\n \n \n   Any mode:\n \nRight ALT - enter Control mode\n(press again to get back to editor)\n \n \n   Control mode:\n \nf - launch fzf\ns - swap FILE A and FILE B\nl - link FILE A and FILE B\nj/k - move link selection down/up\nh - go to selected link\nu - unlink selected link\nr - rename current file\nc - create new file";
  
  textInBox(box, text, r.GetColor(0x00aa00ff));
}

function boundingBox(box) {
  r.DrawRectangleLines(
    box.x1,
    box.y1,
    box.x2 - box.x1,
    box.y2 - box.y1,
    r.GetColor(0xff0000ff));
}

function textInBox(box, str, color) {
  const fontWidth = state.get().font.width;  
  const fontHeight = state.get().font.height; 
  let y = box.y1;

  const lines = str.split('\n');
  for (let line of lines) {
    let x = box.x1;
    for (let character of line) {
      text(character, color, x, y);
      x += fontWidth;
    }
    y += fontHeight;
  }
}

function text(text, color, x, y) {
  r.DrawTextEx(font, text, r.Vector2(x, y), state.get().font.height, 1, color)
}

function setRaylibContext(raylib) {
  r = raylib
  font = r.LoadFontEx(new URL('../assets/iosevka-splendid-regular.ttf', import.meta.url).toString().slice(7), state.get().font.height, 0, 224)
}

export default {editor: drawEditor, debug, log: drawLog, extraText, setRaylibContext, boundingBox, textInBox}
