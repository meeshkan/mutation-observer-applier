export type ICSSRule = {
    cssText: string;
};

export type IStyleSheet = {
    cssRules: ICSSRule[];
};

export const getCSSStyleSheet = (node: HTMLStyleElement): IStyleSheet => {
    const sheet = node.sheet;
    if (!sheet) {
        return {};
    }

    const cssRules: IStyleSheet = [];
    for (let index = 0; index < sheet.cssRules.length; index++) {
        cssRules.push({
            cssText: sheet.cssRules[index].cssText,
        });
    }

    return { cssRules };
};
