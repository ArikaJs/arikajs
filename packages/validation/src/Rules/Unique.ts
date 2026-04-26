import { Rule } from '../Rule';

export class Unique implements Rule {
    private static resolver: (table: string, column: string, value: any, exceptId?: any, idColumn?: string) => Promise<boolean>;

    /**
     * Set the database resolver for the unique rule.
     */
    public static setResolver(resolver: (table: string, column: string, value: any, exceptId?: any, idColumn?: string) => Promise<boolean>) {
        Unique.resolver = resolver;
    }

    constructor(
        private table: string,
        private column?: string,
        private exceptId?: any,
        private idColumn: string = 'id'
    ) {}

    async validate(value: any, attribute: string): Promise<boolean> {
        if (!Unique.resolver) {
            // If no resolver is set, we can't check uniqueness.
            // In some cases, we might want to fail, in others, we might want to log a warning.
            throw new Error('Unique rule database resolver not set. Make sure @arikajs/database is properly initialized.');
        }

        const column = this.column || attribute;
        return await Unique.resolver(this.table, column, value, this.exceptId, this.idColumn);
    }

    message(): string {
        return 'The :attribute has already been taken.';
    }
}
