import * as bcrypt from 'bcryptjs';

export class Hasher {
    /**
     * Create a hash from a plain text value.
     */
    public static async make(value: string, rounds: number = 10): Promise<string> {
        return await bcrypt.hash(value, rounds);
    }

    /**
     * Check if a plain text value matches a hash.
     */
    public static async check(value: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(value, hash);
    }

    /**
     * Check if a hash needs to be rehashed.
     */
    public static needsRehash(hash: string): boolean {
        return false; // Implement proper check later
    }
}
