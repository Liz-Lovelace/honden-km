import * as tmux from './tmux';
import fs from 'fs/promises';

const sessionName = "fzfSession";

export async function run(width, height) {
  console.log("starting new tmux session for fzf");
  await tmux.spawn_console(sessionName, "fzf > /tmp/fzfResult", width, height);
}

export async function send_input(key, modifier_keys = {}) {
  return tmux.send_keys(sessionName, key, modifier_keys);
}

export async function grab_output() {
  return tmux.capture_pane(sessionName);
}

export async function kill() {
  console.log("killing fzf tmux session");
  await tmux.kill_console(sessionName);
}

export async function getLastChoice() {
  try {
    return fs.readFile("/tmp/fzfResult", "utf8");
  } catch (err) {
    console.error("Error reading fzf result file:", err.message);
    return {};
  }
}

