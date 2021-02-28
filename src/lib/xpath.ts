const validNodeTypes = [
    Node.ELEMENT_NODE,
    Node.TEXT_NODE,
    Node.COMMENT_NODE,
];

// Source (modified): https://github.com/thiagodp/get-xpath/blob/master/src/index.ts
export const getXPath = (element: Node | null): string => {
    const parts: string[] = [];
    while (element && validNodeTypes.includes(element.nodeType)) {
        let numberOfPreviousSiblings = 0;
        let hasNextSiblings = false;
        let sibling = element.previousSibling;
        while (sibling) {
            if (
                sibling.nodeType !== Node.DOCUMENT_TYPE_NODE &&
                sibling.nodeName === element.nodeName
            ) {
                numberOfPreviousSiblings++;
            }

            sibling = sibling.previousSibling;
        }

        sibling = element.nextSibling;
        while (sibling) {
            if (sibling.nodeName === element.nodeName) {
                hasNextSiblings = true;
                break;
            }

            sibling = sibling.nextSibling;
        }

        let part: string;
        if ([Node.TEXT_NODE, Node.COMMENT_NODE].includes(element.nodeType)) {
            part = element.nodeName.slice(1) + '()';
        } else {
            const nth = numberOfPreviousSiblings || hasNextSiblings
                ? '[' + (numberOfPreviousSiblings + 1) + ']'
                : '';
            
            part = (element as HTMLElement).localName + nth;
        }

        parts.push(part);
        element = element.parentNode;
    }

    return parts.length ? '/' + parts.reverse().join('/') : '';
};
