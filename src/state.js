let state = {};

function get(prop) {
  return state;
}

function update_recursive(current_state, keys, value) {
  const key = keys.shift();

  if (keys.length === 0) {
    current_state[key] = value;
  } else {
    if (!current_state[key] || typeof current_state[key] !== "object") {
      current_state[key] = {};
    }
    update_recursive(current_state[key], keys, value);
  }
}

function update(property, newValue) {
  const keys = property.split('.');
  update_recursive(state, keys, newValue);
}

export default { get, update };

