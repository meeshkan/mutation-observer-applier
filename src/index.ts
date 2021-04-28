import { JSDOM } from 'jsdom';
import { getXPath } from './lib/xpath';
import { getAttributes } from './lib/attributes';
import type { IAttributes } from './lib/attributes';
import { getCSSStyleSheet } from './lib/stylesheets';
import type { IStyleSheet } from './lib/stylesheets';

const NodeType = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
};

const XPathResult = {
    ANY_TYPE: 0,
    NUMBER_TYPE: 1,
    STRING_TYPE: 2,
    BOOLEAN_TYPE: 3,
    UNORDERED_NODE_ITERATOR_TYPE: 4,
    ORDERED_NODE_ITERATOR_TYPE: 5,
    UNORDERED_NODE_SNAPSHOT_TYPE: 6,
    ORDERED_NODE_SNAPSHOT_TYPE: 7,
    ANY_UNORDERED_NODE_TYPE: 8,
    FIRST_ORDERED_NODE_TYPE: 9,
};

type INode = {
    type: number;
    name: string | null;
    value: string | null;
    innerHTML?: string | null;
    attributes: IAttributes;
    xpath: string;
    tagName?: string;
    data?: string;
    sheet?: IStyleSheet | null
};

type IMutationType = 'attributes' | 'characterData' | 'childList';
type IMutationRecord = {
    type: IMutationType; 
    target: INode | null;
    addedNodes: (INode | null)[];
    removedNodes: (INode | null)[];
    previousSibling: INode | null;
    nextSibling: INode | null;
    attributeName: string | null;
    attributeNamespace: string | null;
    oldValue?: string | null;
};

type IMutationApplier = (mutation: IMutationRecord) => void;
type IMutationAppliersByType = Record<IMutationType, IMutationApplier>;

type INodeInfoIncludeKey = 'innerHTML';

export interface IMutationObserverApplier {
    DOM: string;
    styleSheets: IStyleSheet[];
    serializeStyleSheets(styleSheets: StyleSheetList): IStyleSheet[];
    serializeMutations(mutations: MutationRecord[]): IMutationRecord[];
    applyMutations(serializedMutations: IMutationRecord[]): void;
    tearDown(): void;
}

export default class MutationObserverApplier implements IMutationObserverApplier {
    private dom: JSDOM;
    private sheets: IStyleSheet[];
    private appliersByMutationType: IMutationAppliersByType = {
        childList: this.applyChildListMutation,
        attributes: this.applyAttributesMutation,
        characterData: this.applyCharacterDataMutation,
    };

    constructor(initialDom: string, styleSheets?: IStyleSheet[]) {
        this.dom = new JSDOM(initialDom);
        this.sheets = styleSheets || [];
    }

    get DOM(): string {
        return this.dom.serialize();
    }

    set DOM(currentDom: string) {
        this.dom = new JSDOM(currentDom);
    }

    get styleSheets(): IStyleSheet[] {
        return this.sheets;
    }

    set styleSheets(styleSheets: IStyleSheet[]) {
        this.sheets = styleSheets;
    }

    serializeStyleSheets(styleSheets: StyleSheetList): IStyleSheet[] {
        return Array.from(styleSheets).map((sheet) => {
            return {
                cssRules: Array.from(sheet.cssRules).map((cssRule) => {
                    return {
                        cssText: cssRule.cssText,
                    };
                }),
            };
        });
    }

    private serializeNode(
        node: Node | null,
        include?: Record<INodeInfoIncludeKey, boolean>
    ): (INode | null) {
        if (!node) {
            return null;
        }

        const info: INode = {
            type: node.nodeType,
            name: node.nodeName,
            tagName: (node as HTMLElement).tagName,
            value: node.nodeValue,
            attributes: getAttributes(node as HTMLElement),
            xpath: getXPath(node),
            data: (node as CharacterData).data,
        };

        if (include?.innerHTML) {
            info.innerHTML = (node as HTMLElement).innerHTML;
        }

        if ((node as (HTMLStyleElement | HTMLLinkElement)).sheet) {
            info.sheet = getCSSStyleSheet(node as (HTMLStyleElement | HTMLLinkElement));
        }

        return info;
    }

    serializeMutations(mutations: MutationRecord[]): IMutationRecord[] {
        return mutations.map((mutation: MutationRecord) => {
            return {
                type: mutation.type,
                target: this.serializeNode(mutation.target),
                addedNodes: Array.from(mutation.addedNodes).map(node => {
                    return this.serializeNode(node, { innerHTML: true });
                }),
                removedNodes: Array.from(mutation.removedNodes).map(node => this.serializeNode(node)),
                previousSibling: this.serializeNode(mutation.previousSibling),
                nextSibling: this.serializeNode(mutation.nextSibling),
                attributeName: mutation.attributeName,
                attributeNamespace: mutation.attributeNamespace,
            };
        });
    }

    private getNodeByXPath(xpath: string): (Node | null) {
        const document = this.dom.window.document;
        let node: (Node | null);
        try {
            node = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            node = null;
        }

        return node;
    }

    private getTargetInDomFromMutation(mutation: IMutationRecord): (Node | never | null) {
        const target = mutation.target;
        if (!target) {
            throw new Error('Mutation is missing target element');
        }

        const targetXPath = target.xpath;
        if (!target.xpath) {
            throw new Error('Mutation target is missing an XPath value');
        }

        const targetInDom = this.getNodeByXPath(targetXPath);
        if (!targetInDom) {
            return null;
        }

        return targetInDom;
    }

    private applyChildListMutation(mutation: IMutationRecord): void {
        const targetInDom = this.getTargetInDomFromMutation(mutation) as HTMLElement;
        if (!targetInDom) {
            return;
        }

        let previousSiblingInDom: HTMLElement | null;
        if (mutation.previousSibling?.xpath) {
            previousSiblingInDom = this.getNodeByXPath(mutation.previousSibling.xpath) as HTMLElement;
        }

        let nextSiblingInDom: HTMLElement | null;
        if (mutation.nextSibling?.xpath) {
            nextSiblingInDom = this.getNodeByXPath(mutation.nextSibling.xpath) as HTMLElement;
        }

        mutation.removedNodes.forEach((removedNode) => {
            if (removedNode?.sheet) {
                this.sheets = this.sheets.filter(sheet => {
                    return JSON.stringify(sheet) !== JSON.stringify(removedNode?.sheet);
                });
            }

            let removedNodeInDom;
            if (removedNode?.xpath) {
                removedNodeInDom = this.getNodeByXPath(removedNode.xpath) as HTMLElement;
                if (removedNodeInDom) {
                    removedNodeInDom.remove();
                    return;
                }
            }

            let childInDomToRemove;
            if (previousSiblingInDom) {
                childInDomToRemove = previousSiblingInDom.nextSibling;
            } else if (nextSiblingInDom) {
                childInDomToRemove = nextSiblingInDom.previousSibling;
            } else {
                childInDomToRemove = targetInDom.firstChild;
            }

            if (!childInDomToRemove && !removedNode?.xpath?.startsWith('/html')) {
                removedNodeInDom = this.getNodeByXPath((mutation.target?.xpath || '') + (removedNode?.xpath || ''));
                if (removedNodeInDom) {
                    (removedNodeInDom as HTMLElement).remove();
                    return;
                }
            }

            if (!childInDomToRemove) {
                return;
            }

            targetInDom.removeChild(childInDomToRemove);
        });

        mutation.addedNodes.forEach((addedNode) => {
            const addedNodeAlreadyInDom = this.getNodeByXPath(addedNode?.xpath || '') as HTMLElement;

            const document = this.dom.window.document;

            let newNodeInDom: Node;
            if (addedNode?.tagName) {
                if (['svg', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect'].includes(addedNode?.tagName?.toLowerCase())) {
                    newNodeInDom = document.createElementNS('http://www.w3.org/2000/svg', addedNode?.tagName);
                } else {
                    newNodeInDom = document.createElement(addedNode?.tagName);
                }
            } else if (addedNode?.type === NodeType.TEXT_NODE) {
                newNodeInDom = document.createTextNode(addedNode?.value || ''); 
            } else if (addedNode?.type === NodeType.COMMENT_NODE) {
                newNodeInDom = document.createComment(addedNode?.value || '');
            } else {
                throw new Error(`Could not add node (with XPath ${addedNode?.xpath}) because it is of unrecognizable type`);
            }

            const addedNodeAttributes = addedNode?.attributes;
            Object.keys(addedNodeAttributes || []).forEach((attributeName) => {
                if (!Object.keys(addedNodeAttributes).includes(attributeName)) {
                    return;
                }

                const attributeValue = addedNodeAttributes[attributeName];
                (newNodeInDom as HTMLElement).setAttribute(attributeName, attributeValue);
            });

            (newNodeInDom as HTMLElement).innerHTML = addedNode?.innerHTML || '';
            if (addedNode.sheet) {
                this.sheets.push(addedNode.sheet);
            }

            if (previousSiblingInDom) {
                targetInDom.insertBefore(newNodeInDom, previousSiblingInDom.nextSibling);
            } else if (nextSiblingInDom) {
                targetInDom.insertBefore(newNodeInDom, nextSiblingInDom);
            } else {
                const indexFromXPathObject = /\[([0-9])\]$/.exec(addedNode?.xpath || '');
                if (indexFromXPathObject) {
                    const indexFromXPath = parseInt(indexFromXPathObject[1]);
                    if ([NodeType.TEXT_NODE, NodeType.COMMENT_NODE].includes(addedNode?.type)) {
                        const textOrCommentChildNodes = Array.from(targetInDom.childNodes)
                            .filter(node => node?.nodeType === addedNode?.type);

                        if (textOrCommentChildNodes.length > indexFromXPath) {
                            targetInDom.insertBefore(newNodeInDom, textOrCommentChildNodes[indexFromXPath]);
                        } else {
                            targetInDom.appendChild(newNodeInDom);
                        }
                    } else {
                        const elementChildNodes = Array.from(targetInDom.children)
                            .filter((node) => node?.tagName?.toLowerCase() === addedNode?.tagName?.toLowerCase());

                        if (elementChildNodes.length > indexFromXPath) {
                            targetInDom.insertBefore(newNodeInDom, elementChildNodes[indexFromXPath]);
                        } else {
                            targetInDom.appendChild(newNodeInDom);
                        }
                    }
                } else {
                    targetInDom.appendChild(newNodeInDom);
                }
            }

            if (
                addedNodeAlreadyInDom && (
                    addedNodeAlreadyInDom.isEqualNode(newNodeInDom) ||
                    addedNode?.tagName?.toLowerCase() === 'body'
                )
            ) {
                addedNodeAlreadyInDom.remove();
            }
        });
    }

    private applyAttributesMutation(mutation: IMutationRecord): (void | never) {
        const targetInDom = this.getTargetInDomFromMutation(mutation) as HTMLElement;
        if (!targetInDom) {
            return;
        }

        const targetAttributes = mutation.target?.attributes;
        if (!targetAttributes) {
            throw new Error(`Attributes of mutation target (with XPath ${mutation.target?.xpath}) are missing`);
        }

        const mutatedAttributeName = mutation.attributeName as string;
        if (!mutatedAttributeName) {
            throw new Error(`Mutated attribute name of target (with XPath ${mutation.target?.xpath}) is missing`);
        }

        if (!Object.keys(targetAttributes).includes(mutatedAttributeName)) {
            targetInDom.removeAttribute(mutatedAttributeName);
            return;
        }

        const mutatedAttributeValue = targetAttributes[mutatedAttributeName];
        targetInDom.setAttribute(mutatedAttributeName, mutatedAttributeValue);
    }

    private applyCharacterDataMutation(mutation: IMutationRecord): void {
        const targetInDom = this.getTargetInDomFromMutation(mutation) as CharacterData;
        if (!targetInDom) {
            return;
        }

        targetInDom.replaceData(0, targetInDom.data.length, mutation.target?.data || '');
    }

    private applyMutation(mutation: IMutationRecord): void {
        const applier = this.appliersByMutationType[mutation.type].bind(this);
        applier(mutation);
    }

    applyMutations(serializedMutations: IMutationRecord[]): void {
        serializedMutations.forEach(this.applyMutation.bind(this));
    }

    tearDown(): void {
        this.dom.window.close();
    }
}
