import { JSDOM } from 'jsdom';
import { getXPath } from './lib/xpath';
import { getAttributes } from './lib/attributes'; 
import type { IAttributes } from './lib/attributes';

type INode = {
    type: number;
    value: string | null;
    outerHTML: string | null;
    innerHTML: string | null;
    attributes: IAttributes;
    xpath: string;
    parentXPath?: string;
    data?: string;
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

            const xpath = getXPath(node);
            const info = {
                type: node.nodeType,
                name: node.nodeName,
                tagName: node.tagName,
                value: node.nodeValue,
                outerHTML: node.outerHTML,
                innerHTML: node.innerHTML,
                attributes: getAttributes(node),
                xpath: getXPath(node),
                data: node.data,
            }

            if (!xpath) {
                return {
                    ...info,
                    parentXPath: getXPath(node.parentNode)
                };
            }

            return info;
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
            const document = this.dom.window.document;
            const target = mutation.target;
            if (!target) {
                return;
            }

            let targetInDom, targetXPath;

            switch (mutation.type) {
                case 'childList':
                    /* One or more children have been added to and/or removed
                     * from the tree.
                     * (See mutation.addedNodes and mutation.removedNodes.) */
                    targetXPath = target.xpath;
                    if (!targetXPath) {
                        return;
                    }

                    targetInDom = document.evaluate(
                        targetXPath,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue as HTMLElement;

                    let previousSiblingInDom, nextSiblingInDom;
                    if (mutation.previousSibling && mutation.previousSibling.xpath) {
                        previousSiblingInDom = document.evaluate(
                            mutation.previousSibling.xpath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue as HTMLElement;
                    }

                    if (mutation.nextSibling && mutation.nextSibling.xpath) {
                        nextSiblingInDom = document.evaluate(
                            mutation.nextSibling.xpath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue as HTMLElement;
                    }

                    if (!previousSiblingInDom && !nextSiblingInDom) {
                        return;
                    }

                    mutation.addedNodes.forEach((addedNode) => {
                        const newElementInDom = document.createElement(addedNode.tagName);
                        newElementInDom.innerHTML = addedNode.innerHTML;
                        if (previousSiblingInDom) {
                            targetInDom.insertBefore(newElementInDom, previousSiblingInDom.nextSibling);
                        } else {
                            targetInDom.insertBefore(newElementInDom, nextSiblingInDom);
                        }
                    });

                    mutation.removedNodes.forEach((removedNode) => {
                        if (previousSiblingInDom) {
                            targetInDom.removeChild(previousSiblingInDom.nextSibling);
                        } else {
                            targetInDom.removeChild(nextSiblingInDom.previousSibling);
                        }
                    });
                    break;
                case 'attributes':
                    /* An attribute value changed on the element in
                     * mutation.target.
                     * The attribute name is in mutation.attributeName, and
                     * its previous value is in mutation.oldValue. */
                    targetXPath = target.xpath;
                    if (!targetXPath) {
                        return;
                    }

                    targetInDom = document.evaluate(
                        targetXPath,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue as HTMLElement;

                    const targetAttributes = target?.attributes;
                    if (!targetAttributes) {
                        return;
                    }

                    const mutatedAttributeName = mutation.attributeName as string;
                    if (mutatedAttributeName) {
                        const mutatedAttributeValue = targetAttributes[mutatedAttributeName];
                        if (!mutatedAttributeValue) {
                           targetInDom.removeAttribute(mutatedAttributeName);
                           return;
                        }

                        targetInDom.setAttribute(mutatedAttributeName, mutatedAttributeValue);
                    }

                    break;
                case 'characterData':
                    const targetData = target.data;
                    const targetParentXPath = target.parentXPath;
                    if (!targetParentXPath) {
                        return;
                    }

                    const targetParentInDom = document.evaluate(
                        targetParentXPath,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue as HTMLElement;

                    targetInDom = targetParentInDom.firstChild as characterData;
                    targetInDom.replaceData(0, targetInDom.length, targetData);
                    break;
            }
        });
    }
}
