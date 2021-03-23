import * as React from 'react';
import debounce from 'lodash-es/debounce';
import Tippy from '@tippyjs/react';
import '../styles/index.scss';

const App = ({}) => {
  const replaceInput = React.useRef<HTMLInputElement>(undefined);
  const findInput = React.useRef<HTMLInputElement>(undefined);
  const [textNodes, setTextNodes] = React.useState([]);
  const [currentNode, setCurrentNode] = React.useState(-1);
  const [isDirty, setIsDirty] = React.useState(false);
  const [foundAtLeastOne, setFoundAtLeastOne] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

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

      if (type === 'update-text-objects') {
        let newNodes = JSON.parse(data);
        setTextNodes(nodes => [...nodes, ...newNodes]);
        if (newNodes.length > 0) {
          setFoundAtLeastOne(true);
        }
      }

      if (type === 'done') {
        setIsLoading(false);
      }

      if (type === 'get-text-objects') {
        let d = JSON.parse(data);
        setTextNodes(d);
        setCurrentNode(0);
        move();
      }

      if (type === 'replace') {
        console.log(data);

        setTextNodes(oldValues => {
          let values = [...oldValues];
          values.splice(values.indexOf(data), 1);
          return values;
        });

        toast('Replaced!');
      }
    };
  }, []);

  React.useEffect(() => {
    move();
  }, [currentNode]);

  React.useEffect(() => {
    console.log('found at-least one');
    if (foundAtLeastOne == true) setCurrentNode(0);
    else setCurrentNode(-1);
  }, [foundAtLeastOne]);

  React.useEffect(() => {
    if (textNodes.length == 0) {
    }
    setCurrentNode(0);
    move();
  }, [textNodes]);

  React.useEffect(() => {
    findText();
  }, [matchCase, matchWord, regEx, inSelection]);

  const findText = debounce(function() {
    const text = findInput.current.value;

    setTextNodes([]);
    setCurrentNode(-1);
    setFoundAtLeastOne(false);
    setIsLoading(true);

    if (text === '') {
      setIsDirty(false);
      setIsLoading(false);
      return;
    }

    let data = [text, matchWord, matchCase, regEx, inSelection, preserveCase];
    setIsDirty(true);
    parent.postMessage({pluginMessage: {type: 'get-text-objects', data}}, '*');
  }, 500);

  const replace = id => {
    let data = [
      id,
      findInput.current.value,
      replaceInput.current.value,
      matchWord,
      matchCase,
      regEx,
      inSelection,
      preserveCase,
    ];
    parent.postMessage({pluginMessage: {type: 'replace', data}}, '*');
  };

  const replaceCurrent = () => {
    if (textNodes.length === 0) return;
    replace(textNodes[currentNode]);
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
      replace(e);
    });
  };

  const move = () => {
    if (!textNodes[currentNode]) return;
    parent.postMessage(
      {
        pluginMessage: {
          type: 'goto',
          data: textNodes[currentNode],
        },
      },
      '*'
    );
  };

  const next = () => {
    console.log('----');
    console.log(textNodes);
    if (currentNode === textNodes.length - 1) setCurrentNode(0);
    else setCurrentNode(currentNode + 1);
  };

  const prev = () => {
    if (currentNode === 0) setCurrentNode(textNodes.length - 1);
    else setCurrentNode(currentNode - 1);
  };

  const setSelection = () => {
    // selectionNodes
    setInSelection(!inSelection);
    if (!inSelection) {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'set-selection',
            data: inSelection,
          },
        },
        '*'
      );
      toast('Finding within current selection');
    } else {
      toast('Finding in Current Page');
    }
  };

  return (
    <div className="page">
      <div className="row close">
        <div className="col f">
          <div className="input">
            <input
              tabIndex={1}
              className="input__field pfix"
              ref={findRef}
              placeholder="Find"
              onChange={findText}
            ></input>
            {/* <div className="post-fix">
              {textNodes.length > 0 && <span>{currentNode + 1} of&nbsp;</span>} {textNodes.length}
            </div> */}
          </div>
        </div>
        <div className="col">
          <div className="row actions">
            <Tippy content="Match whole word" delay={[500, 100]}>
              <button
                className={'icon-button' + (matchWord ? ' icon-button--selected' : '')}
                onClick={() => setMatchWord(!matchWord)}
                tabIndex={3}
              >
                <div className="icon icon--match-word"></div>
              </button>
            </Tippy>
            <Tippy content="Match case" delay={[500, 100]}>
              <button
                className={'icon-button' + (matchCase ? ' icon-button--selected' : '')}
                onClick={() => setMatchCase(!matchCase)}
                tabIndex={4}
              >
                <div className="icon icon--match-case"></div>
              </button>
            </Tippy>
            <Tippy content="Use Regular expression" delay={[500, 100]}>
              <button
                className={'icon-button' + (regEx ? ' icon-button--selected' : '')}
                onClick={() => setRegEx(!regEx)}
                tabIndex={5}
              >
                <div className="icon icon--regex"></div>
              </button>
            </Tippy>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col f">
          <input className="input__field" tabIndex={2} ref={replaceRef} placeholder="Replace"></input>
        </div>
        <div className="col">
          <div className="row actions">
            <Tippy content="Find in selection" delay={[500, 100]}>
              <button className={'icon-button' + (inSelection ? ' icon-button--selected' : '')} onClick={setSelection}>
                <div className="icon icon--frame"></div>
              </button>
            </Tippy>
            <div style={{display: 'none'}}>
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
      </div>
      <div className="row footer">
        <div className="actions">
          {foundAtLeastOne && textNodes.length > 0 && (
            <div className="pagination">
              <div className="post-fix">
                {textNodes.length > 0 && (
                  <span>
                    {currentNode + 1} of {textNodes.length}
                  </span>
                )}
              </div>
              <Tippy content="Previous match" delay={[500, 100]}>
                <button
                  className="icon-button nf"
                  onClick={prev}
                  tabIndex={6}
                  disabled={textNodes.length > 0 ? false : true}
                >
                  <div className="icon icon--back"></div>
                </button>
              </Tippy>
              <Tippy content="Next match" delay={[500, 100]}>
                <button
                  className="icon-button nf"
                  onClick={next}
                  tabIndex={7}
                  disabled={textNodes.length > 0 ? false : true}
                >
                  <div className="icon icon--forward"></div>
                </button>
              </Tippy>
            </div>
          )}

          {!foundAtLeastOne && isDirty && !isLoading && <div className="post-fix">No matches found</div>}
          {isLoading && !foundAtLeastOne && <div className="post-fix">Searching...</div>}
        </div>
        <div className="actions">
          <button
            className="button button--secondary"
            onClick={replaceCurrent}
            disabled={textNodes.length > 0 ? false : true}
          >
            Replace
          </button>
          &nbsp;&nbsp;&nbsp;
          <button
            className="button button--primary"
            onClick={replaceAll}
            disabled={textNodes.length > 0 ? false : true}
          >
            Replace all
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
