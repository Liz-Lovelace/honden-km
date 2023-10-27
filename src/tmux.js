import { exec } from 'child_process';
import { promises as fs } from 'fs';
import config from './config.js';
import { log } from './logger.js';

async function spawn_console(session, command, width, height) {
  const res = await execPromise(`tmux new-session -d -s ${session} "cd ${config.baseFileStorePath}; ${command}"`);
  await sleep(80);
  await resize_window(session, width, height);
}

async function kill_console(session) {
  await execPromise(`tmux kill-session -t ${session}`);
}

async function send_keys(session, love_keycode, modifier_keys = []) {
  const tmux_keycode = love_to_tmux_key(love_keycode, modifier_keys);
  await execPromise(`tmux send-keys -t ${session} ${tmux_keycode}`);
}

async function resize_window(session, width, height) {
  await execPromise(`tmux resize-window -x ${width} -y ${height} -t ${session}`);
}

// TODO: this is a huge resource hog, figure out how to optimize it
async function capture_pane(session) {
  const [cursor_position, content] = await Promise.all([
    execPromise(`tmux display-message -p -F '#{cursor_x},#{cursor_y}' -t ${session}`),
    execPromise(`tmux capture-pane -p -t ${session}`)
  ]);

  const [x, y] = cursor_position.trim().split(',').map(Number);

  return {
    content,
    cursor: { x: x || 0, y: y || 0 }
  };
}


function love_to_tmux_key(love_key, modifier_keys = {}) {
  const love_tmux_key_map = {
    escape: 'Escape',
    home: 'Home',
    end: 'End',
    tab: 'Tab',
    return: 'Enter',
    space: 'Space',
    up: 'Up',
    left: 'Left',
    down: 'Down',
    right: 'Right',
    pageup: 'PPage',
    pagedown: 'NPage',
    backspace: 'BSpace',
    capslock: '',
    lshift: '',
    rshift: '',
    lctrl: '',
    rctrl: '',
    lalt: '',
    ralt: '',
    lgui: '',
    '\'': '\'\\\'\'',
    insert: 'IC',
    delete: 'DC',
    f1: 'F1',
    f2: 'F2',
    f3: 'F3',
    f4: 'F4',
    f5: 'F5',
    f6: 'F6',
    f7: 'F7',
    f8: 'F8',
    f9: 'F9',
    f10: 'F10',
    f11: 'F11',
    f12: 'F12',
    ';': '\\;'
  };

  const shift_love_tmux_key_map = {
    a: 'A',
    b: 'B',
    c: 'C',
    d: 'D',
    e: 'E',
    f: 'F',
    g: 'G',
    h: 'H',
    i: 'I',
    j: 'J',
    k: 'K',
    l: 'L',
    m: 'M',
    n: 'N',
    o: 'O',
    p: 'P',
    q: 'Q',
    r: 'R',
    s: 'S',
    t: 'T',
    u: 'U',
    v: 'V',
    w: 'W',
    x: 'X',
    y: 'Y',
    z: 'Z',
    '`': '~',
    '1': '!',
    '2': '@',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '0': ')',
    '-': '_',
    '=': '+',
    '[': '{',
    ']': '}',
    '\\': '|',
    ';': ':',
    '\'': '"',
    ',': '<',
    '.': '>',
    '/': '?'
  };

  let tmux_key = love_tmux_key_map[love_key] || love_key;

  if (modifier_keys.shift === true) {
    tmux_key = shift_love_tmux_key_map[love_key] || tmux_key;
  }

  let modifier = "";
  if (modifier_keys.ctrl) modifier = "C-";
  if (modifier_keys.alt) modifier = "M-";

  if (tmux_key && tmux_key.length > 0) {
    return modifier + tmux_key;
  } else {
    return "";
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`TMUX ERROR: ${error}`);
      }
      resolve(stdout);
    });
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {spawn_console, kill_console, send_keys, resize_window, capture_pane};
