import { Model } from 'arikajs';

export class User extends Model {
    protected static table = 'users';

    public declare id: number;
    public declare name: string;
    public declare email: string;
    public declare password: string;
    public declare email_verified_at: string | Date | null;

    protected fillable: string[] = [
        'name',
        'email',
        'password',
        'email_verified_at',
    ];

    protected hidden: string[] = [
        'password',
    ];

    public hasVerifiedEmail(): boolean {
        return this.email_verified_at !== null;
    }
}
