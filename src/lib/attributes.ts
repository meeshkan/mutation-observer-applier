export type IAttributes = {
    [key: string]: string;
};

export const getAttributes = (element: any): IAttributes => {
    const attributesObject: IAttributes = {};
    if (!element || !element.attributes) {
        return {};
    }

    for (let attribute, i = 0, attributes = element.attributes, n = attributes.length; i < n; i++) {
        attribute = attributes[i];
        attributesObject[attribute.nodeName] = attribute.nodeValue;
    }

    return attributesObject;
};
