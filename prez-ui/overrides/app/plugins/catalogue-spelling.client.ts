const substitutions: Array<[RegExp, string]> = [
    [/\bCatalogues\b/g, "Registers"],
    [/\bCatalogue\b/g, "Register"],
    [/\bCatalogs\b/g, "Registers"],
    [/\bCatalog\b/g, "Register"],
    [/\bcatalogues\b/g, "registers"],
    [/\bcatalogue\b/g, "register"],
    [/\bcatalogs\b/g, "registers"],
    [/\bcatalog\b/g, "register"],
];

function useCatalogueSpelling(value: string): string {
    return substitutions.reduce(
        (result, [pattern, replacement]) => result.replace(pattern, replacement),
        value,
    );
}

const realGraphPattern = /^\s*(?:(?:https:\/\/olis\.dev\/)|olis:)?Real\s*Graph\s*$/i;
const codePredicates = new Set([
    "https://linked.data.gov.au/def/pid/redirectRules",
    "https://linked.data.gov.au/def/pid/headers",
]);

function enhanceMetadata(root: Element): void {
    const links = [
        ...(root.matches("a[href]") ? [root as HTMLAnchorElement] : []),
        ...root.querySelectorAll<HTMLAnchorElement>("a[href]"),
    ];

    for (const link of links) {
        const href = link.getAttribute("href") ?? "";
        if (href === "https://olis.dev/RealGraph") {
            const value = link.parentElement;
            if (value && realGraphPattern.test(value.textContent ?? "")) value.remove();
            continue;
        }

        if (codePredicates.has(href)) {
            const row = link.closest("tr");
            const valueCell = row?.querySelector<HTMLTableCellElement>("td:nth-child(2)");
            valueCell?.classList.add("pid-code-value");
        }
    }
}

function updateText(root: Node): void {
    if (root.nodeType === Node.TEXT_NODE && root.nodeValue) {
        if (realGraphPattern.test(root.nodeValue)) {
            root.parentElement?.remove();
            return;
        }
        const replacement = useCatalogueSpelling(root.nodeValue);
        if (replacement !== root.nodeValue) root.nodeValue = replacement;
        return;
    }

    if (!(root instanceof Element)) return;
    enhanceMetadata(root);

    for (const attribute of ["aria-label", "title"]) {
        const value = root.getAttribute(attribute);
        if (value) {
            const replacement = useCatalogueSpelling(value);
            if (replacement !== value) root.setAttribute(attribute, replacement);
        }
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) updateText(walker.currentNode);
}

export default defineNuxtPlugin(() => {
    const apply = () => updateText(document.body);
    apply();

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "characterData") updateText(mutation.target);
            for (const node of mutation.addedNodes) updateText(node);
        }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
});
