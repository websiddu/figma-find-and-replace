figma.showUI(__html__, {width: 400, height: 160});

let currentSelection = undefined;
let timers = [];
let timer = undefined;

const findInString = (str, data) => {
  let [text, matchWord, matchCase, regEx] = data;

  if (regEx) {
    try {
      const gi = matchCase ? 'g' : 'gi';
      const re = new RegExp(text, gi);
      const arr = str.match(re);
      return arr && arr.length > 0 ? true : false;
    } catch (err) {}
  }

  if (matchWord) {
    return str.split(' ').some(word => {
      if (this.caseSensitive) return word === text;
      else return word.toLowerCase() === text.toLowerCase();
    });
  } else if (matchCase) {
    return str.includes(text);
  }

  return str.toLowerCase().includes(text.toLowerCase());
};

const setCharacters = async (node: TextNode, newText: string) => {
  await figma.loadFontAsync(node.getRangeFontName(0, 1) as FontName);
  node.characters = newText;

  figma.ui.postMessage({
    type: 'replace',
    data: node.id,
  });
};

const escapeRegExp = string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const replace = data => {
  let [id, findText, replaceWith, matchWord, matchCase] = data;

  const node = <TextNode>figma.getNodeById(id);
  if (!node) return;

  const text = node.characters;
  const gi = matchCase ? 'g' : 'gi';

  if (matchWord || matchCase) {
    findText = escapeRegExp(findText);
  }

  try {
    let re = new RegExp(findText, gi);
    let newStr = text.replace(re, replaceWith);
    setCharacters(node, newStr);
  } catch (err) {}
};

// This is a generator that recursively produces all the nodes in subtree
// starting at the given node
function* walkTree(node) {
  yield node;
  let children = node.children;
  if (children) {
    for (let child of children) {
      yield* walkTree(child);
    }
  }
}

function searchFor(query, data) {
  query = query.toLowerCase();
  let walker = walkTree(figma.currentPage);

  function processOnce() {
    let results = [];
    let count = 0;
    let done = true;
    let res;
    while (!(res = walker.next()).done) {
      let node = res.value;
      if (node.type === 'TEXT') {
        if (findInString(node.characters, data)) {
          results.push(node.id);
        }
      }
      if (++count === 1000) {
        done = false;
        timer = setTimeout(processOnce, 20);
        break;
      }
    }

    figma.ui.postMessage({type: 'update-results', data: {query, results, done}});
  }

  processOnce();
}

figma.ui.onmessage = msg => {
  switch (msg.type) {
    case 'set-selection':
      currentSelection = figma.currentPage.selection;
      figma.ui.postMessage({
        type: 'set-selection',
        data: JSON.stringify(currentSelection.length),
      });

      break;
    case 'get-text-objects':
      let [str] = msg.data;
      if (str !== undefined) {
        if (timer) clearTimeout(timer);
        if (str) searchFor(str, msg.data);
      }
      break;
    case 'replace':
      replace(msg.data);
      break;
    case 'goto':
      let nodeToGo = <SceneNode>figma.getNodeById(msg.data);
      figma.currentPage.selection = [nodeToGo];
      figma.viewport.scrollAndZoomIntoView([nodeToGo]);
      break;

    case 'toast':
      figma.notify(msg.data, {timeout: 1000});
      break;

    default:
      break;
  }
};
