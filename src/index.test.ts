import MutationObserverDiff from './index';

const fixtures = {
  attributes: {
    add: {
      initialDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p>Well, it\'s actually nothing more than another test website...</p></body></html>',
      mutations: [{
        type: 'attributes',
        target: {
          type: 1,
          value: null,
          outerHTML: '<p style="color:red">Well, it\'s actually nothing more than another test website...</p>',
          attributes: {
            style: 'color:red;'
          },
          xpath: '/html/body/p'
        },
        addedNodes: [],
        removedNodes: [],
        previousSibling: null,
        nextSibling: null,
        attributeName: 'style',
        attributeNamespace: null
      }],
      finalDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p style="color:red;">Well, it\'s actually nothing more than another test website...</p></body></html>',
    },
    edit: {
      initialDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p style="color:red;">Well, it\'s actually nothing more than another test website...</p></body></html>',
      mutations: [{
        type: 'attributes',
        target: {
          type: 1,
          value: null,
          outerHTML: '<p style="color:red">Well, it\'s actually nothing more than another test website...</p>',
          attributes: {
            style: 'color:green;'
          },
          xpath: '/html/body/p'
        },
        addedNodes: [],
        removedNodes: [],
        previousSibling: null,
        nextSibling: null,
        attributeName: 'style',
        attributeNamespace: null
      }],
      finalDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p style="color:green;">Well, it\'s actually nothing more than another test website...</p></body></html>',
    },
    remove: {
      initialDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p style="color:red;">Well, it\'s actually nothing more than another test website...</p></body></html>',
      mutations: [{
        type: 'attributes',
        target: {
          type: 1,
          value: null,
          outerHTML: '<p>Well, it\'s actually nothing more than another test website...</p>',
          attributes: {},
          xpath: '/html/body/p'
        },
        addedNodes: [],
        removedNodes: [],
        previousSibling: null,
        nextSibling: null,
        attributeName: 'style',
        attributeNamespace: null
      }],
      finalDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p>Well, it\'s actually nothing more than another test website...</p></body></html>',
    },
  },
  characterData: {
    add: {
      initialDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p>Well, it\'s actually nothing more than another test website...</p></body></html>',
      mutations: [{
        type: 'characterData',
        target: {
          type: 3,
          value: 'Well, it\'s actually nothing more than another test website... Don\'t act so surprised!',
          attributes: {},
          xpath: '',
          parentXPath: '/html/body/p',
          data: 'Well, it\'s actually nothing more than another test website... Don\'t act so surprised!'
        },
        addedNodes: [],
        removedNodes: [],
        previousSibling: null,
        nextSibling: null,
        attributeName: null,
        attributeNamespace: null
      }],
      finalDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p>Well, it\'s actually nothing more than another test website... Don\'t act so surprised!</p></body></html>',
    },
    remove: {
      initialDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p>Well, it\'s actually nothing more than another test website...</p></body></html>',
      mutations: [{
        type: 'characterData',
        target: {
          type: 3,
          value: 'Well, it\'s nothing more than another test website.',
          attributes: {},
          xpath: '',
          parentXPath: '/html/body/p',
          data: 'Well, it\'s nothing more than another test website.'
        },
        addedNodes: [],
        removedNodes: [],
        previousSibling: null,
        nextSibling: null,
        attributeName: null,
        attributeNamespace: null
      }],
      finalDom: '<html><head><title>Cool Website</title></head><body><h1>Welcome to the coolest website!</h1><p>Well, it\'s nothing more than another test website.</p></body></html>',
    },
  },
};

describe('applyMutations()', () => {
  it('adds attributes', () => {
    const mod = new MutationObserverDiff(fixtures.attributes.add.initialDom);
    expect(mod.DOM).toBe(fixtures.attributes.add.initialDom);
    mod.applyMutations(fixtures.attributes.add.mutations);
    expect(mod.DOM).toBe(fixtures.attributes.add.finalDom);
  });
  it('edits attributes', () => {
    const mod = new MutationObserverDiff(fixtures.attributes.edit.initialDom);
    expect(mod.DOM).toBe(fixtures.attributes.edit.initialDom);
    mod.applyMutations(fixtures.attributes.edit.mutations);
    expect(mod.DOM).toBe(fixtures.attributes.edit.finalDom);
  });
  it('removes attributes', () => {
    const mod = new MutationObserverDiff(fixtures.attributes.remove.initialDom);
    expect(mod.DOM).toBe(fixtures.attributes.remove.initialDom);
    mod.applyMutations(fixtures.attributes.remove.mutations);
    expect(mod.DOM).toBe(fixtures.attributes.remove.finalDom);
  });

  it('adds character data', () => {
    const mod = new MutationObserverDiff(fixtures.characterData.add.initialDom);
    expect(mod.DOM).toBe(fixtures.characterData.add.initialDom);
    mod.applyMutations(fixtures.characterData.add.mutations);
    expect(mod.DOM).toBe(fixtures.characterData.add.finalDom);
  });
  it('removes character data', () => {
    const mod = new MutationObserverDiff(fixtures.characterData.remove.initialDom);
    expect(mod.DOM).toBe(fixtures.characterData.remove.initialDom);
    mod.applyMutations(fixtures.characterData.remove.mutations);
    expect(mod.DOM).toBe(fixtures.characterData.remove.finalDom);
  });
});
