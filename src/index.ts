import { JSDOM } from 'jsdom';
import { getXPath } from './lib/xpath';
import { getAttributes } from './lib/attributes'; 
import type { IAttributes } from './lib/attributes';

type INode = {
    type: number;
    value: string | null;
    outerHTML: string | null;
    attributes: IAttributes;
    xpath: string;
}

type IMutationRecord = {
    type: 'attributes' | 'characterData' | 'childList';
    target: INode | null;
    addedNodes: (INode | null)[];
    removedNodes: (INode | null)[];
    previousSibling: INode | null;
    nextSibling: INode | null;
    attributeName: string | null;
    attributeNamespace: string | null;
    oldValue?: string | null;
}

export default class MutationObserverDiff {
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
        const nodeInfo = (node: any): INode | null => {
            if (!node) {
                return null;
            }

            return {
                type: node.nodeType,
                value: node.nodeValue,
                outerHTML: node.outerHTML,
                attributes: getAttributes(node),
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
                    const document = this.dom.window.document;
                    const target = mutation.target;
                    if (!target) {
                        return;
                    }

                    const targetXPath = target?.xpath;
                    const targetAttributes = target?.attributes;
                    if (!targetXPath || !targetAttributes) {
                        return;
                    }

                    const targetInDOM = document.evaluate(targetXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
                    const mutatedAttributeName = mutation.attributeName as string;
                    if (mutatedAttributeName) {
                        const mutatedAttributeValue = targetAttributes[mutatedAttributeName];
                        if (!mutatedAttributeValue) {
                           targetInDOM.removeAttribute(mutatedAttributeName);
                           return;
                        }

                        targetInDOM.setAttribute(mutatedAttributeName, mutatedAttributeValue);
                    }

                    break;
                case 'characterData':
                    break;
            }
        })
    }
}
