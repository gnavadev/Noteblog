/**
 * Utility functions for processing markdown content
 */

/**
 * Strips Cherry Markdown specific syntax from content
 * to produce clean plain text for excerpts/previews.
 * 
 * Removes:
 * - Block directives like ::: justify, ::: center, etc.
 * - Inline directives
 * - Custom markers like !! text !!
 */
export function stripCherryFormatting(content: string): string {
    if (!content) return '';

    return content
        // Remove block directives (e.g., ::: justify ... :::)
        // This regex looks for lines starting with ::: and removes the marker line
        // but keeps the content inside if it's just a style wrapper.
        // For simple ":::" lines (closing), it removes them.
        .replace(/^:::\s*[a-zA-Z0-9-]+\s*$/gm, '')
        .replace(/^:::$/gm, '')

        // Remove inline directives if any (less common but possible)
        .replace(/:::[^:]+:::/g, '')

        // Remove "!! text !!" background color markers, keeping the text
        .replace(/!!\s*(.*?)\s*!!/g, '$1')

        // Clean up multiple empty lines that might result from removals
        .replace(/\n\s*\n/g, '\n')
        .trim();
}
