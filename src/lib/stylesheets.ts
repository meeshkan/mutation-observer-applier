export type ICSSRule = {
    cssText: string;
};

export type IStyleSheet = {
    cssRules: ICSSRule[];
};

export const getCSSStyleSheet = (node: HTMLStyleElement): (IStyleSheet | {}) => {
    const sheet = node.sheet as CSSStyleSheet;
    if (!sheet) {
        return {};
    }

    return Array.from(sheet.cssRules).map((cssRule: CSSRule) => {
        return {
            cssText: cssRule.cssText,
        }
    });
};
