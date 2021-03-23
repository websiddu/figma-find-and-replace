figma.showUI(__html__, {width: 400, height: 160});

let currentSelection = undefined;
let timers = [];

figma.ui.onmessage = msg => {
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

  const postMessage = data => {
    figma.ui.postMessage({
      type: 'update-text-objects',
      data: JSON.stringify(data),
    });
  };

  const findPredicate = n => {
    return n.type === 'TEXT' && n.characters != undefined && findInString(n.characters, msg.data);
  };

  const escapeRegExp = string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const clearAllTimers = () => {
    for (var i = 0; i < timers.length; i++) {
      clearTimeout(timers[i]);
    }
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

  const findAll = node => {
    let promise = new Promise((resolve, reject) => {
      let nodes = node.findAll(findPredicate);
      nodes = nodes.map(e => e.id);
      if (nodes) resolve(nodes);
      else reject([]);
    });

    return promise;
  };

  switch (msg.type) {
    case 'set-selection':
      currentSelection = figma.currentPage.selection;
      figma.ui.postMessage({
        type: 'set-selection',
        data: JSON.stringify(currentSelection.length),
      });

      break;
    case 'get-text-objects':
      clearAllTimers();

      let children = figma.currentPage.children;
      if (msg.data[4]) {
        children = figma.currentPage.selection;
      }

      const delayedFind = node => {
        findAll(node).then((nodes: any) => {
          postMessage(nodes);
        });
      };

      // const NODE_TYPES = ['INSTANCE', 'FRAME', 'GROUP'];
      const NODE_TYPES_GROUP = ['INSTANCE', 'GROUP', 'COMPONENT', 'FRAME'];

      for (let i = 0; i < children.length; i++) {
        let node = children[i];
        if (findPredicate(node)) postMessage([node.id]);
        if (NODE_TYPES_GROUP.includes(node.type)) {
          const subChildren = node['children'];
          for (let j = 0; j < subChildren.length; j++) {
            const subnode = subChildren[j];
            if (findPredicate(subnode)) postMessage([subnode.id]);
            if (NODE_TYPES_GROUP.includes(subnode.type)) {
              delayedFind(subnode);
            }
          }
        }
      }

      figma.ui.postMessage({
        type: 'done',
        data: JSON.stringify({done: true}),
      });
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

  //   figma.closePlugin();
};
