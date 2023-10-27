import tmux from './tmux.js';

const sessionName = "editorSession";

async function run(filename, width, height) {
  await tmux.spawn_console(sessionName, "nvim " + filename, width, height);
}

async function send_input(key, modifier_keys = {}) {
  return tmux.send_keys(sessionName, key, modifier_keys);
}

async function grab_output() {
  return tmux.capture_pane(sessionName);
}

async function resize(width, height) {
  return tmux.resize_window(sessionName, width, height);
}

async function kill() {
  await tmux.send_keys(sessionName, "escape");
  await tmux.send_keys(sessionName, "escape");
  await tmux.send_keys(sessionName, ":");
  await tmux.send_keys(sessionName, "w");
  await tmux.send_keys(sessionName, "return");
  await tmux.kill_console(sessionName);
}

export default {run, send_input, grab_output, resize, kill};
