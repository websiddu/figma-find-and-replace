figma.showUI(__html__, {width: 420, height: 160});

figma.ui.onmessage = msg => {
  const findInString = (str, test) => {
    const re = new RegExp(test);
    const arr = str.match(re);
    return arr && arr.length > 0 ? true : false;
  };

  const setCharacters = async (node: TextNode, newText: string) => {
    await figma.loadFontAsync(node.getRangeFontName(0, 1) as FontName);
    node.characters = newText;

    figma.ui.postMessage({
      type: 'replace',
      data: true,
    });
  };

  switch (msg.type) {
    case 'get-text-objects':
      const text = figma.currentPage.findAll(n => {
        return n.type === 'TEXT' && n.characters != undefined && findInString(n.characters, msg.text);
      });

      const items = text.map(e => {
        return {characters: e['characters'], id: e.id};
      });

      figma.ui.postMessage({
        type: 'get-text-objects',
        data: JSON.stringify(items),
      });
      break;
    case 'replace':
      const node = <TextNode>figma.getNodeById(msg.data[0]);
      const re = new RegExp(msg.data[1]);
      const str = node.characters.replace(re, msg.data[2]);
      setCharacters(node, str);

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

  //   if (msg.type === 'create-rectangles') {
  //     const nodes = [];

  //     for (let i = 0; i < msg.count; i++) {
  //       const rect = figma.createRectangle();
  //       rect.x = i * 150;
  //       rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
  //       figma.currentPage.appendChild(rect);
  //       nodes.push(rect);
  //     }

  //     figma.currentPage.selection = nodes;
  //     figma.viewport.scrollAndZoomIntoView(nodes);

  //     // This is how figma responds back to the ui
  //     figma.ui.postMessage({
  //       type: 'create-rectangles',
  //       message: `Created ${msg.count} Rectangles`,
  //     });
  //   }

  //   figma.closePlugin();
};
