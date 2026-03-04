export class MessageSelector {
    /**
     * Select a proper message from a message line based on a given number.
     */
    public choose(line: string, number: number, locale: string): string {
        const segments = line.split('|');

        // Check for specific range matches like {0} or [2,5]
        for (const segment of segments) {
            const match = this.getRangeMatch(segment, number);
            if (match !== null) {
                return match.trim();
            }
        }

        // Default to standard pluralization (first segment is singular, second is plural)
        const pluralIndex = this.getPluralIndex(number, locale);

        if (segments.length === 1) {
            return segments[0].trim();
        }

        return (segments[pluralIndex] || segments[0]).trim();
    }

    /**
     * Get the index for the plural forms.
     * Simplistic version: 0 if number is 1, else 1.
     */
    private getPluralIndex(number: number, locale: string): number {
        // Most languages use 0 for singular (1) and 1 for plural (not 1)
        return number === 1 ? 0 : 1;
    }

    /**
     * Check if a segment matches a specific range.
     */
    private getRangeMatch(segment: string, number: number): string | null {
        const match = segment.match(/^[\{\[]([^\}\]]+)[\}\]](.*)/s);

        if (!match) {
            return null;
        }

        const condition = match[1];
        const text = match[2];

        if (condition.includes(',')) {
            const [from, to] = condition.split(',').map(s => s.trim());

            if (to === '*' && number >= parseInt(from)) {
                return text;
            } else if (from === '*' && number <= parseInt(to)) {
                return text;
            } else if (number >= parseInt(from) && number <= parseInt(to)) {
                return text;
            }
        }

        if (parseInt(condition) === number) {
            return text;
        }

        return null;
    }
}
