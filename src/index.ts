import { JSDOM } from 'jsdom';
import { getXPath } from './lib/xpath';
import { getAttributes } from './lib/attributes';
import type { IAttributes } from './lib/attributes';
import { getCSSStyleSheet } from './lib/stylesheets';
import type { IStyleSheet } from './lib/stylesheets';

type INode = {
    type: number;
    value: string | null;
    innerHTML: string | null;
    attributes: IAttributes;
    xpath: string;
    parentXPath?: string;
    data?: string;
    sheet?: IStyleSheet;
};

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
};

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
                innerHTML: node.innerHTML,
                attributes: getAttributes(node),
                xpath: getXPath(node),
                data: node.data,
            }

            if (node.tagName && node.tagName.toLowerCase() === 'style') {
                info.sheet = getCSSStyleSheet(node);
            }

            if (!xpath) {
                return {
                    ...info,
                    parentXPath: getXPath(node.parentNode),
                    parentChildIndex: Array.from(node.parentNode?.childNodes || []).indexOf(node),
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

    private getElementByXPath(xpath: string): HTMLElement {
        const document = this.dom.window.document;
        return document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue as HTMLElement;
    }

    applyMutations(serializedMutations: IMutationRecord[]) {
        serializedMutations.forEach((mutation: IMutationRecord) => {
            const target = mutation.target;
            if (!target) {
                return;
            }

            let targetInDom, targetXPath;

            switch (mutation.type) {
                case 'childList':
                    targetXPath = target.xpath;
                    if (!targetXPath) {
                        return;
                    }

                    targetInDom = this.getElementByXPath(targetXPath);
                    let previousSiblingInDom, nextSiblingInDom;
                    if (mutation.previousSibling) {
                        if (mutation.previousSibling.xpath) {
                            previousSiblingInDom = this.getElementByXPath(mutation.previousSibling.xpath);
                        } else if (mutation.previousSibling.parentXPath) {
                            previousSiblingInDom = this.getElementByXPath(mutation.previousSibling.parentXPath).childNodes[mutation.previousSibling.parentChildIndex];
                        }
                    }

                    if (mutation.nextSibling) {
                        if (mutation.nextSibling.xpath) {
                            nextSiblingInDom = this.getElementByXPath(mutation.nextSibling.xpath);
                        } else if (mutation.nextSibling.parentXPath) {
                            nextSiblingInDom = this.getElementByXPath(mutation.nextSibling.parentXPath).childNodes[mutation.nextSibling.parentChildIndex];
                        }
                    }

                    mutation.addedNodes.forEach((addedNode) => {
                        const document = this.dom.window.document;
                        const newElementInDom = document.createElement(addedNode.tagName);
                        Object.keys(addedNode.attributes).forEach((attributeName) => {
                            newElementInDom.setAttribute(
                                attributeName,
                                addedNode.attributes[attributeName]
                            );
                        });

                        newElementInDom.innerHTML = addedNode.innerHTML;
                        if (previousSiblingInDom) {
                            targetInDom.insertBefore(newElementInDom, previousSiblingInDom.nextSibling);
                        } else if (nextSiblingInDom) {
                            targetInDom.insertBefore(newElementInDom, nextSiblingInDom);
                        } else {
                            targetInDom.appendChild(newElementInDom);
                        }
                    });

                    mutation.removedNodes.forEach((removedNode) => {
                        if (previousSiblingInDom) {
                            targetInDom.removeChild(previousSiblingInDom.nextSibling);
                        } else if (nextSiblingInDom) {
                            targetInDom.removeChild(nextSiblingInDom.previousSibling);
                        } else {
                            targetInDom.removeChild(targetInDom.firstChild);
                        }
                    });

                    break;
                case 'attributes':
                    targetXPath = target.xpath;
                    if (!targetXPath) {
                        return;
                    }

                    targetInDom = this.getElementByXPath(targetXPath);
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

                    const targetParentInDom = this.getElementByXPath(targetParentXPath);
                    targetInDom = targetParentInDom.firstChild as characterData;
                    targetInDom.replaceData(0, targetInDom.length, targetData);
                    break;
            }
        });
    }
}
