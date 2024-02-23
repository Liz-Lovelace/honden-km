import Fuse from 'fuse.js';

function applySearch(search, inodes) {
  if (search == ' ') {
    return inodes;
  }

  const options = {
    keys: ['entity.filename'],
    includeScore: true,
    threshold: 0.3,
  };
  const fuse = new Fuse(inodes, options);
  return fuse.search(search).map(result => result.item);
}

function explainError(error) {
  console.log('(from explainError)');
  console.log(error);
  let errorDescription = `<code>${error.name}: ${error.message}<br>`;

  if (error.stack) {
    const stackLine = error.stack.split('\n')[1].trim();
    const match = stackLine.match(/at .+ \((?:.+\/)*(.+?):(\d+):(\d+)\)$/);
    if (match) {
      errorDescription += `at ${match[1]}:${match[2]}<br>`;
    }
  }

  errorDescription += '<br> also: <br>';

  Object.keys(error).forEach(key => {
    if (key !== 'name' && key !== 'message' && key !== 'stack') {
      errorDescription += `${key}: ${error[key]}<br>`;
    }
  });

  errorDescription += '</code>';

  return errorDescription;
}

export { applySearch, explainError };
