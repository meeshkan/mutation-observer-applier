import MutationObserverDiff from './index';
import { JSDOM } from 'jsdom';

describe('applyMutations()', () => {
  it('adds attributes', () => {
    const initialDom = '<!doctype html><html><body><p>Hello world!</p></body></html>';
    const dom = new JSDOM(initialDom);
    const { window: { document } } = dom;
    const mod = new MutationObserverDiff(dom.serialize());
    const targetNode = document.querySelector('p');

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
  });
  it('edits attributes', () => {
    const initialDom = '<!doctype html><html><body><p>Hello world!</p></body></html>';
    const dom = new JSDOM(initialDom);
    const { window: { document } } = dom;
    const targetNode = document.querySelector('p');
    targetNode.setAttribute('style', 'color: red;');
    const mod = new MutationObserverDiff(dom.serialize());
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
  });
  it('removes attributes', () => {
    const initialDom = '<!doctype html><html><body><p>Hello world!</p></body></html>';
    const dom = new JSDOM(initialDom);
    const { window: { document } } = dom;
    const targetNode = document.querySelector('p');
    targetNode.setAttribute('style', 'color: red;');
    const mod = new MutationObserverDiff(dom.serialize());
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
  });

  it('modifies character data', () => {
    const initialDom = '<!doctype html><html><body><h1>Welcome to the coolest website!</h1><p>Well, it\'s actually nothing more than another test website...</p>'
    const dom = new JSDOM(initialDom);
    const { window: { document } } = dom;
    const targetNode = document.querySelector('p');
    const mod = new MutationObserverDiff(dom.serialize());
    targetNode.innerText = 'Well, it\'s actually nothing more than another test website... Don\'t act so surprised!'

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
  });
  it('adds elements to the DOM tree', () => {
    const initialDom = '<!doctype html><html><head><title>Cool Website</title></head><body><h1>Shopping List</h1><ul><li>Coffee</li><li>Tea</li><li>Milk</li></ul></body></html>';
    const dom = new JSDOM(initialDom);
    const { window: { document } } = dom;
    const targetNode = document.querySelector('ul');
    const mod = new MutationObserverDiff(dom.serialize());
    const addedNode = document.createElement('li');
    addedNode.appendChild(document.createTextNode('Chocolate'));
    targetNode.appendChild(addedNode);

    const mutations = [{
      type: 'childList',
      target: targetNode,
      addedNodes: [addedNode],
      removedNodes: [],
      previousSibling: addedNode.previousSibling,
      nextSibling: null,
      attributeName: null,
      attributeNamespace: null,
    }];

    const serializedMutations = mod.serializeMutations(mutations);
    mod.applyMutations(serializedMutations);
    expect(mod.DOM).toBe(dom.serialize());
  });
  it('removes elements from the DOM tree', () => {
    const initialDom = '<!doctype html><html><head><title>Cool Website</title></head><body><h1>Shopping List</h1><ul><li>Coffee</li><li>Tea</li><li>Milk</li></ul></body></html>';
    const dom = new JSDOM(initialDom);
    const { window: { document } } = dom;
    const targetNode = document.querySelector('ul');
    const mod = new MutationObserverDiff(dom.serialize());
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
  });
});
