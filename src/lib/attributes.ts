export type IAttributes = Record<string, string>;

export const getAttributes = (element: HTMLElement): IAttributes => {
    const attributesObject: IAttributes = {};
    if (!element || !element.attributes) {
        return {};
    }

    return Array.from(element.attributes).reduce((accumulator, attribute) => {
        accumulator[attribute.name] = attribute.value;
        return accumulator;
    }, {} as IAttributes);
};
