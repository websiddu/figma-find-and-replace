figma.showUI(__html__, {width: 400, height: 160});

let currentSelection = undefined;

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
      data: true,
    });
  };

  const findPredicate = n => {
    return n.type === 'TEXT' && n.characters != undefined && findInString(n.characters, msg.data);
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

  switch (msg.type) {
    case 'set-selection':
      currentSelection = figma.currentPage.selection;
      figma.ui.postMessage({
        type: 'set-selection',
        data: JSON.stringify(currentSelection.length),
      });

      break;
    case 'get-text-objects':
      let textNodes = [];

      if (msg.data[4] && currentSelection) {
        for (const node of currentSelection) {
          if (node.type === 'FRAME') {
            let nodesInFrame = node.findAll(findPredicate);
            textNodes = [...nodesInFrame, ...textNodes];
          }
        }
      } else {
        textNodes = figma.currentPage.findAll(findPredicate);
      }

      textNodes = textNodes.sort((b, a) => {
        if (a.y < b.y) return 1;
        if (a.y > b.y) return -1;
        if (a.x < b.x) return 1;
        if (a.x > b.x) return -1;
        return 1;
      });

      const nodes = textNodes.map(e => {
        return {characters: e['characters'], id: e.id};
      });

      figma.ui.postMessage({
        type: 'get-text-objects',
        data: JSON.stringify(nodes),
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
