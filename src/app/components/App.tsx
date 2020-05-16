// import * as React from 'react';
import * as React from 'react';
import Tippy from '@tippyjs/react';
import '../styles/index.scss';

const App = ({}) => {
  const replaceInput = React.useRef<HTMLInputElement>(undefined);
  const findInput = React.useRef<HTMLInputElement>(undefined);
  const [textNodes, setTextNodes] = React.useState([]);
  const [currentNode, setCurrentNode] = React.useState(-1);

  const [matchWord, setMatchWord] = React.useState(false);
  const [matchCase, setMatchCase] = React.useState(false);
  const [regEx, setRegEx] = React.useState(false);

  const [inSelection, setInSelection] = React.useState(false);
  const [preserveCase, setPreserveCase] = React.useState(false);

  const replaceRef = React.useCallback((element: HTMLInputElement) => {
    replaceInput.current = element;
  }, []);

  const findRef = React.useCallback((element: HTMLInputElement) => {
    findInput.current = element;
  }, []);

  React.useEffect(() => {
    window.onmessage = async event => {
      const {type, data} = event.data.pluginMessage;
      if (type === 'get-text-objects') {
        let d = JSON.parse(data);
        setTextNodes(d);
        setCurrentNode(0);
        move();
      }

      if (type === 'replace') {
        findText();
        toast('Replaced!');
      }
    };
  }, []);

  React.useEffect(() => {
    move();
  }, [currentNode, textNodes]);

  const findText = () => {
    const text = findInput.current.value;

    if (text === '') {
      setCurrentNode(-1);
      setTextNodes([]);
      return;
    }

    parent.postMessage({pluginMessage: {type: 'get-text-objects', text}}, '*');
  };

  const replaceCurrent = () => {
    if (textNodes.length === 0) return;
    let data = [textNodes[currentNode].id, findInput.current.value, replaceInput.current.value];
    parent.postMessage({pluginMessage: {type: 'replace', data}}, '*');
  };

  const toast = msg => {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'toast',
          data: msg,
        },
      },
      '*'
    );
  };

  const replaceAll = () => {
    textNodes.forEach(e => {
      let data = [e.id, findInput.current.value, replaceInput.current.value];
      parent.postMessage({pluginMessage: {type: 'replace', data}}, '*');
    });
  };

  const move = () => {
    console.log(textNodes, currentNode);
    if (!textNodes[currentNode]) return;
    parent.postMessage(
      {
        pluginMessage: {
          type: 'goto',
          data: textNodes[currentNode].id,
        },
      },
      '*'
    );
  };

  const next = () => {
    if (currentNode === textNodes.length - 1) setCurrentNode(0);
    else setCurrentNode(currentNode + 1);
  };

  const prev = () => {
    if (currentNode === 0) setCurrentNode(textNodes.length - 1);
    else setCurrentNode(currentNode - 1);
  };

  return (
    <div className="page">
      <div className="row close">
        <div className="col f">
          <div className="input">
            <input className="input__field pfix" ref={findRef} placeholder="Find" onChange={findText}></input>
            <div className="post-fix">
              {textNodes.length > 0 && <span>{currentNode + 1} of&nbsp;</span>} {textNodes.length}
            </div>
          </div>
        </div>
        <div className="col">
          <div className="row actions">
            <Tippy content="Match whole word" delay={[500, 100]}>
              <button
                className={'icon-button' + (matchWord ? ' icon-button--selected' : '')}
                onClick={() => setMatchWord(!matchWord)}
              >
                <div className="icon icon--match-word"></div>
              </button>
            </Tippy>
            <Tippy content="Match case" delay={[500, 100]}>
              <button
                className={'icon-button' + (matchCase ? ' icon-button--selected' : '')}
                onClick={() => setMatchCase(!matchCase)}
              >
                <div className="icon icon--match-case"></div>
              </button>
            </Tippy>
            <Tippy content="Use Regular expression" delay={[500, 100]}>
              <button
                className={'icon-button' + (regEx ? ' icon-button--selected' : '')}
                onClick={() => setRegEx(!regEx)}
              >
                <div className="icon icon--regex"></div>
              </button>
            </Tippy>

            <div className="divider"></div>
            <Tippy content="Previous match" delay={[500, 100]}>
              <div className="icon-button" onClick={prev}>
                <div className="icon icon--back"></div>
              </div>
            </Tippy>

            <Tippy content="Next match" delay={[500, 100]}>
              <div className="icon-button" onClick={next}>
                <div className="icon icon--forward"></div>
              </div>
            </Tippy>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col f">
          <input className="input__field" ref={replaceRef} placeholder="Replace"></input>
        </div>
        <div className="col">
          <div className="row actions">
            <Tippy content="Find in selection" delay={[500, 100]}>
              <button
                className={'icon-button' + (inSelection ? ' icon-button--selected' : '')}
                onClick={() => setInSelection(!inSelection)}
              >
                <div className="icon icon--corners"></div>
              </button>
            </Tippy>

            <Tippy content="Preserve case" delay={[500, 100]}>
              <button
                className={'icon-button' + (preserveCase ? ' icon-button--selected' : '')}
                onClick={() => setPreserveCase(!preserveCase)}
              >
                <div className="icon icon--preserve-case"></div>
              </button>
            </Tippy>
          </div>
        </div>
      </div>
      <div className="row footer">
        <button
          className="button button--secondary"
          onClick={replaceCurrent}
          disabled={textNodes.length > 0 ? false : true}
        >
          Replace
        </button>
        &nbsp;&nbsp;&nbsp;
        <button className="button button--primary" onClick={replaceAll} disabled={textNodes.length > 0 ? false : true}>
          Replace all
        </button>
      </div>
    </div>
  );
};

export default App;
