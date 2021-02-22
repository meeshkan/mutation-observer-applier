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

    return Array.from(sheet.cssRules).map((cssRule) => {
        return {
            cssText: cssRule.cssText,
        }
    });
};