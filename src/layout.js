import state from './state.js';
import r from 'raylib';

const columns = {
  screenLeft: 0,
  left: 0.01,
  b: 0.475,
  c: 0.63,
  d: 0.8,
  right: 0.99,
  screenRight: 1,
};

const rows = {
  screenTop: 0,
  top: 0.01,
  a: 0.1,
  b: 0.3,
  bottom: 0.91,
  screenBottom: 1,
};

class Box {
  constructor(box) {
    this.x1 = box.x1;
    this.x2 = box.x2;
    this.y1 = box.y1;
    this.y2 = box.y2;
  }

  getWidth() {
    return this.x2 - this.x1;
  }

  getHeight() {
    return this.y2 - this.y1;
  }

  getCharWidth() {
    return Math.floor(this.getWidth() / state.get().font.width);
  }

  getCharHeight() {
    return Math.floor(this.getHeight() / state.get().font.height);
  }

  inset(width) {
    return new Box({
      x1: this.x1 + width,
      y1: this.y1 + width,
      x2: this.x2 - width,
      y2: this.y2 - width,
    });
  }
}

function computeCoordinates(box) {
  let width = r.GetRenderWidth()
  let height = r.GetRenderHeight()
  return {
    x1: Math.floor(box.x1 * width),
    y1: Math.floor(box.y1 * height),
    x2: Math.floor(box.x2 * width),
    y2: Math.floor(box.y2 * height),
  };
}

const boxesTemplate = {
  content: { x1: columns.left, y1: rows.top, x2: columns.b, y2: rows.bottom },
  links: { x1: columns.b, y1: rows.a, x2: columns.c, y2: rows.bottom },
  debug: { x1: columns.c, y1: rows.top, x2: columns.d, y2: rows.b },
  log: { x1: columns.c, y1: rows.b, x2: columns.d, y2: rows.bottom },
  extraText: { x1: columns.d, y1: rows.top, x2: columns.right, y2: rows.bottom },
  filesAB: { x1: columns.b, y1: rows.top, x2: columns.c, y2: rows.a },
  focus: { x1: columns.c, y1: rows.bottom, x2: columns.d, y2: rows.bottom },
  runlines: { x1: columns.screenLeft, x2: columns.screenRight, y1: rows.bottom, y2: rows.screenBottom },
};

function getBox(boxName) {
  const box = boxesTemplate[boxName];
  return new Box(computeCoordinates(box));
}

export default {getBox}
