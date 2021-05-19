# Mutation Observer Applier

Apply [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) mutations to a DOM.

This library takes mutations consumed by a Mutation Observer and applies them to a DOM successively to get a sequence of DOMs. It is like [`diff-patch-match`](https://github.com/google/diff-match-patch), but for DOMs.

## How it works

The API consists of a single class, `MutationObserverApplier`, with two main functions:

- `serializeMutations(mutations: MutationRecord[]): IMutationRecord[];` - serialize a list of mutations emitted by the DOM.
- `applyMutations(serializedMutations: IMutationRecord[]): void;` - apply serialized mutations. The resulting DOM is present on `this.DOM`.
    
For examples of these two functions in use, please see the [tests](https://github.com/meeshkan/mutation-observer-applier/blob/main/src/index.test.ts).

The library is written in typescript and uses the standard Web API types defined in [`lib.dom.d`](https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.mutationobserver.html). For example, `MutationRecord` is defined [here](https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.mutationrecord.html).

## How it is used

At [Meeshkan](https://meeshkan.com/?utm_source=github&utm_medium=readme&utm_campaign=mutation_observer_diff), we use this library to create videos of interactions with a DOM. Since it was incorporated into our stack, it has reduced the CPU usage of our recording script by ~70%.

## License

MIT © [Meeshkan](http://meeshkan.com/)
