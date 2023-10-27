import r from 'raylib'
import layout from './layout.js';
import draw from './draw.js';
import state from './state.js';
import {log} from './logger.js';
import editor from './editor.js';

main()

async function main() {
  r.SetConfigFlags(r.FLAG_FULLSCREEN_MODE | r.FLAG_WINDOW_RESIZABLE | r.FLAG_VSYNC_HINT);
  r.SetWindowSize(1600, 900);
  r.InitWindow(1600, 900, 'Honden System');

  initializeState();

  await swapIntoA('README.note');

  draw.setRaylibContext(r);

  log('HONDEN SYS INITIALIZATION COMPLETE')

  while (!r.WindowShouldClose()) {
    await drawEverything();
  }

  await editor.kill();
  r.CloseWindow();
}

async function drawEverything() {
  r.BeginDrawing();
  r.ClearBackground(r.GetColor(0x0));
  r.DrawFPS(0, 0);
  for (let box of [
  "content",
  "links",
  "log",
  "debug",
  "extraText",
  "filesAB",
  "focus",
  ]){
   draw.boundingBox(layout.getBox(box)); 
  };

  draw.extraText();
    r.EndDrawing()
    return;
  draw.log();
  await draw.debug();
  await draw.editor();


  r.EndDrawing();
}

function initializeState() {
  state.update("font.width", 7);
  state.update("font.height", 18);

  state.update("modifier_keys.shift", false);
  state.update("modifier_keys.ctrl", false);
  state.update("modifier_keys.alt", false);

  state.update("fileA", "scratchpad.note");

  state.update("focus", "editor");

  state.update("frame_number", 0);
}

async function swapIntoA(fileName) {
  await editor.kill();
  await editor.run(fileName, layout.getBox("content").inset(10).getCharWidth(), layout.getBox("content").inset(10).getCharHeight());
  state.update("fileB", state.get().fileA);
  state.update("fileA", fileName);
  state.update("chosen_link", 1);
}

