import { JSDOM } from 'jsdom';
import MutationObserverApplier from './index';
import { getCSSStyleSheet } from './lib/stylesheets';

test('adds attributes', () => {
  const initialDom = '<!doctype html><html><body><p>Hello world!</p></body></html>';
  const dom = new JSDOM(initialDom);
  const { window: { document } } = dom;
  const mod = new MutationObserverApplier(dom.serialize());
  const targetNode = document.querySelector('p');
  targetNode.setAttribute('style', 'color: red;');

  const mutations = [{
    type: 'attributes',
    target: targetNode,
    addedNodes: [],
    removedNodes: [],
    previousSibling: null,
    nextSibling: null,
    attributeName: 'style',
    attributeNamespace: null,
  }];

  const serializedMutations = mod.serializeMutations(mutations);
  mod.applyMutations(serializedMutations);
  expect(mod.DOM).toBe(dom.serialize());
  window.close();
  mod.tearDown();
});

test('edits attributes', () => {
  const initialDom = '<!doctype html><html><body><p>Hello world!</p></body></html>';
  const dom = new JSDOM(initialDom);
  const { window: { document } } = dom;
  const targetNode = document.querySelector('p');
  targetNode.setAttribute('style', 'color: red;');
  const mod = new MutationObserverApplier(dom.serialize());
  targetNode.setAttribute('style', 'color: green;');

  const mutations = [{
    type: 'attributes',
    target: targetNode,
    addedNodes: [],
    removedNodes: [],
    previousSibling: null,
    nextSibling: null,
    attributeName: 'style',
    attributeNamespace: null,
  }];

  const serializedMutations = mod.serializeMutations(mutations);
  mod.applyMutations(serializedMutations);
  expect(mod.DOM).toBe(dom.serialize());
  window.close();
  mod.tearDown();
});

test('removes attributes', () => {
  const initialDom = '<!doctype html><html><body><p>Hello world!</p></body></html>';
  const dom = new JSDOM(initialDom);
  const { window: { document } } = dom;
  const targetNode = document.querySelector('p');
  targetNode.setAttribute('style', 'color: red;');
  const mod = new MutationObserverApplier(dom.serialize());
  targetNode.removeAttribute('style');

  const mutations = [{
    type: 'attributes',
    target: targetNode,
    addedNodes: [],
    removedNodes: [],
    previousSibling: null,
    nextSibling: null,
    attributeName: 'style',
    attributeNamespace: null,
  }];

  const serializedMutations = mod.serializeMutations(mutations);
  mod.applyMutations(serializedMutations);
  expect(mod.DOM).toBe(dom.serialize());
  window.close();
  mod.tearDown();
});

test('modifies character data', () => {
  const initialDom = '<!doctype html><html><body><h1>Welcome to the coolest website!</h1><p>Well, it\'s actually nothing more than another test website...</p>';
  const dom = new JSDOM(initialDom);
  const { window: { document } } = dom;
  const targetNode = document.querySelector('p');
  const mod = new MutationObserverApplier(dom.serialize());
  targetNode.firstChild.nodeValue = 'Well, it is actually just another test website... Don\'t act so surprised!';

  const mutations = [{
    type: 'characterData',
    target: targetNode.firstChild,
    addedNodes: [],
    removedNodes: [],
    previousSibling: null,
    nextSibling: null,
    attributeName: null,
    attributeNamespace: null,
  }];

  const serializedMutations = mod.serializeMutations(mutations);
  mod.applyMutations(serializedMutations);
  expect(mod.DOM).toBe(dom.serialize());
  window.close();
  mod.tearDown();
});

test('adds elements to the DOM tree', () => {
  const initialDom = '<!doctype html><html><head><title>Cool Website</title></head><body><h1>Shopping List</h1><ul><li>Coffee</li><li>Tea</li><li>Milk</li></ul></body></html>';
  const dom = new JSDOM(initialDom);
  const { window: { document } } = dom;
  const targetNode = document.querySelector('ul');
  const mod = new MutationObserverApplier(dom.serialize());
  const addedNode = document.createElement('li');
  const addedTextNode = document.createTextNode('Chocolate');
  addedNode.appendChild(addedTextNode);
  targetNode.appendChild(addedNode);

  const mutations = [
    {
      type: 'childList',
      target: targetNode,
      addedNodes: [addedNode],
      removedNodes: [],
      previousSibling: addedNode.previousSibling,
      nextSibling: addedNode.nextSibling,
      attributeName: null,
      attributeNamespace: null,
    },
    {
      type: 'childList',
      target: addedNode,
      addedNodes: [addedTextNode],
      removedNodes: [],
      previousSibling: addedTextNode.previousSibling,
      nextSibling: addedTextNode.nextSibling,
      attributeName: null,
      attributeNamespace: null,
    }
  ];

  const serializedMutations = mod.serializeMutations(mutations);
  mod.applyMutations(serializedMutations);
  expect(mod.DOM).toBe(dom.serialize());
  window.close();
  mod.tearDown();
});

test('removes elements from the DOM tree', () => {
  const initialDom = '<!doctype html><html><head><title>Cool Website</title></head><body><h1>Shopping List</h1><ul><li>Coffee</li><li>Tea</li><li>Milk</li></ul></body></html>';
  const dom = new JSDOM(initialDom);
  const { window: { document } } = dom;
  const targetNode = document.querySelector('ul');
  const mod = new MutationObserverApplier(dom.serialize());
  const removedNode = targetNode.childNodes[1];
  const previousSibling = removedNode.previousSibling;
  const nextSibling = removedNode.nextSibling;
  targetNode.removeChild(removedNode);

  const mutations = [{
    type: 'childList',
    target: targetNode,
    addedNodes: [],
    removedNodes: [removedNode],
    previousSibling,
    nextSibling,
    attributeName: null,
    attributeNamespace: null,
  }];

  const serializedMutations = mod.serializeMutations(mutations);
  mod.applyMutations(serializedMutations);
  expect(mod.DOM).toBe(dom.serialize());
  window.close();
  mod.tearDown();
});

test('adds stylesheets', () => {
  const initialDom = '<!doctype html><html><body><p>Hello world!</p></body></html>';
  const dom = new JSDOM(initialDom);
  const { window: { document } } = dom;
  const mod = new MutationObserverApplier(dom.serialize());
  const targetNode = document.querySelector('p');
  const styleElement = document.createElement('style');
  document.head.appendChild(styleElement);
  const styleSheet = styleElement.sheet;
  styleSheet.insertRule('p { color: red; }', 0);

  const mutations = [{
    type: 'childList',
    target: document.head,
    addedNodes: [styleElement],
    removedNodes: [],
    previousSibling: styleElement.previousSibling,
    nextSibling: styleElement.nextSibling,
    attributeName: null,
    attributeNamespace: null,
  }];

  const serializedMutations = mod.serializeMutations(mutations);
  mod.applyMutations(serializedMutations);
  expect(mod.styleSheets).toStrictEqual([getCSSStyleSheet(styleElement)]);
  expect(mod.DOM).toBe(dom.serialize());
  window.close();
  mod.tearDown();
});

test('removes stylesheets', () => {
  const initialDom = '<!doctype html><html><body><p>Hello world!</p></body></html>';
  const dom = new JSDOM(initialDom);
  const { window: { document } } = dom;
  const targetNode = document.querySelector('p');
  const styleElement = document.createElement('style');
  document.head.appendChild(styleElement);
  const styleSheet = styleElement.sheet;
  styleSheet.insertRule('p { color: red; }', 0);
  const mod = new MutationObserverApplier(dom.serialize());
  mod.styleSheets = [getCSSStyleSheet(styleElement)];

  const mutations = [{
    type: 'childList',
    target: document.head,
    addedNodes: [],
    removedNodes: [styleElement],
    previousSibling: styleElement.previousSibling,
    nextSibling: styleElement.nextSibling,
    attributeName: null,
    attributeNamespace: null,
  }];

  const serializedMutations = mod.serializeMutations(mutations);
  mod.applyMutations(serializedMutations);
  expect(mod.styleSheets).toStrictEqual([]);
  styleElement.remove();
  expect(mod.DOM).toBe(dom.serialize());
  window.close();
  mod.tearDown();
});
