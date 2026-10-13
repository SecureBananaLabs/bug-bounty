/**
 * String casing converters for camelCase and snake_case.
 * Safely handles compound words, acronyms, kebab-case, snake_case, and whitespace.
 */

const WORD_SPLIT_REGEX = /[A-Z]{2,}(?=[A-Z][a-z]+|\b)|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g;

/**
 * Extracts words from a string.
 * @param {string} str
 * @returns {string[]}
 */
function getWords(str) {
    if (str == null) return [];
    return String(str)
        .replace(/['’]/g, "")
        .match(WORD_SPLIT_REGEX) || [];
}

/**
 * Converts string to camelCase.
 * @param {string} str Input string
 * @returns {string} camelCase string
 */
export function camelCase(str) {
    const words = getWords(str);
    if (words.length === 0) return "";

    return words
        .map((word, index) => {
            const lower = word.toLowerCase();
            if (index === 0) {
                return lower;
            }
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join("");
}

/**
 * Converts string to snake_case.
 * @param {string} str Input string
 * @returns {string} snake_case string
 */
export function snakeCase(str) {
    const words = getWords(str);
    if (words.length === 0) return "";

    return words.map((w) => w.toLowerCase()).join("_");
}