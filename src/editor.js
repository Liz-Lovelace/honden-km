import * as tmux from './tmux.js';

const sessionName = "editorSession";

export async function run(filename, width, height) {
  await tmux.spawn_console(sessionName, "nvim " + filename, width, height);
}

export async function send_input(key, modifier_keys = {}) {
  return tmux.send_keys(sessionName, key, modifier_keys);
}

export async function grab_output() {
  return tmux.capture_pane(sessionName);
}

export async function resize(width, height) {
  return tmux.resize_window(sessionName, width, height);
}

export async function kill() {
  await tmux.send_keys(sessionName, "escape");
  await tmux.send_keys(sessionName, "escape");
  await tmux.send_keys(sessionName, ":");
  await tmux.send_keys(sessionName, "w");
  await tmux.send_keys(sessionName, "return");
  await tmux.kill_console(sessionName);
}
