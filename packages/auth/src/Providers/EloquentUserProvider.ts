import { UserProvider } from '../Contracts/UserProvider';
import { Hasher } from '../Hasher';

export class EloquentUserProvider implements UserProvider {
    constructor(private model: any) { }

    /**
     * Retrieve a user by their unique identifier.
     */
    public async retrieveById(identifier: string | number): Promise<any | null> {
        return await this.model.where('id', identifier).first();
    }

    /**
     * Retrieve a user by their unique identifier and "remember me" token.
     */
    public async retrieveByToken(identifier: string | number, token: string): Promise<any | null> {
        // Implement remember token logic if needed
        return null;
    }

    /**
     * Update the "remember me" token for the given user in storage.
     */
    public async updateRememberToken(user: any, token: string): Promise<void> {
        // Implement remember token logic if needed
    }

    /**
     * Retrieve a user by the given credentials.
     */
    public async retrieveByCredentials(credentials: Record<string, any>): Promise<any | null> {
        if (Object.keys(credentials).length === 0 ||
            (Object.keys(credentials).length === 1 && 'password' in credentials)) {
            return null;
        }

        let query = this.model;

        for (const key in credentials) {
            if (key === 'password') {
                continue;
            }
            query = query.where(key, credentials[key]);
        }

        return await query.first();
    }

    /**
     * Validate a user against the given credentials.
     */
    public async validateCredentials(user: any, credentials: Record<string, any>): Promise<boolean> {
        const plain = credentials.password;
        return await Hasher.check(plain, user.password);
    }

    /**
     * Rehash the user's password if required.
     */
    public async rehashPasswordIfRequired(user: any, credentials: Record<string, any>, force: boolean = false): Promise<void> {
        if (Hasher.needsRehash(user.password) || force) {
            user.password = await Hasher.make(credentials.password);
            await user.save();
        }
    }
}
