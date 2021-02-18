// Source (modified): https://github.com/thiagodp/get-xpath/blob/master/src/index.ts
export const getXPath = (element: any): string => {
    let nodeElement = element;
    let parts: string[] = [];
    while (nodeElement && nodeElement.nodeType === Node.ELEMENT_NODE) {
        let nbOfPreviousSiblings = 0;
        let hasNextSiblings = false;
        let sibling = nodeElement.previousSibling;
        while (sibling) {
            if (sibling.nodeType !== Node.DOCUMENT_TYPE_NODE &&
                sibling.nodeName === nodeElement.nodeName) {
                nbOfPreviousSiblings++;
            }

            sibling = sibling.previousSibling;
        }

        sibling = nodeElement.nextSibling;
        while (sibling) {
            if (sibling.nodeName === nodeElement.nodeName) {
                hasNextSiblings = true;
                break;
            }

            sibling = sibling.nextSibling;
        }

        let prefix = nodeElement.prefix ? nodeElement.prefix + ':' : '';
        let nth = nbOfPreviousSiblings || hasNextSiblings
            ? '[' + (nbOfPreviousSiblings + 1) + ']'
            : '';

        parts.push(prefix + nodeElement.localName + nth);
        nodeElement = nodeElement.parentNode;
    }

    return parts.length ? '/' + parts.reverse().join('/') : '';
};
