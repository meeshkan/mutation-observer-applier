import { JSDOM } from 'jsdom';
import { getXPath } from './lib/xpath';

type INode = {
    type: number;
    value: string | null;
    outerHTML: string | null;
    attributes: string[];
    xpath: string;
}

type IMutationRecord = {
    type: 'attributes' | 'characterData' | 'childList';
    target: INode;
    addedNodes: INode[];
    removedNodes: INode[];
    previousSibling: INode;
    nextSibling: INode;
    attributeName: string | null;
    attributeNamespace: string | null;
    oldValue?: string | null;
}

class MutationObserverDiff {
    private dom: JSDOM;

    constructor(initialDom: string) {
        this.dom = new JSDOM(initialDom);
    }

    get DOM(): string {
        return this.dom.serialize();
    }

    set DOM(currentDom: string) {
        this.dom = new JSDOM(currentDom);
    }

    serializeMutations(mutations: MutationRecord[]): IMutationRecord[] {
        const nodeInfo = (node: any): INode => {
            return {
                type: node.nodeType,
                value: node.nodeValue,
                outerHTML: node.outerHTML,
                attributes: node.attributes,
                xpath: getXPath(node),
            }
        };

        return mutations.map((mutation: MutationRecord) => {
            return {
                type: mutation.type,
                target: nodeInfo(mutation.target),
                addedNodes: Array.from(mutation.addedNodes).map(nodeInfo),
                removedNodes: Array.from(mutation.removedNodes).map(nodeInfo),
                previousSibling: nodeInfo(mutation.previousSibling),
                nextSibling: nodeInfo(mutation.nextSibling),
                attributeName: mutation.attributeName,
                attributeNamespace: mutation.attributeNamespace,
            };
        });
    };

    applyMutations(serializedMutations: IMutationRecord[]) {
        serializedMutations.forEach((mutation: IMutationRecord) => {
            switch(mutation.type) {
                case 'childList':
                    /* One or more children have been added to and/or removed
                     * from the tree.
                     * (See mutation.addedNodes and mutation.removedNodes.) */
                    break;
                case 'attributes':
                    /* An attribute value changed on the element in
                     * mutation.target.
                     * The attribute name is in mutation.attributeName, and
                     * its previous value is in mutation.oldValue. */
                    break;
                case 'characterData':
                    break;
            }
        })
    }
}
