import { Model } from 'arikajs';

export class User extends Model {
    protected static table = 'users';

    protected fillable: string[] = [
        'name',
        'email',
        'password',
    ];

    protected hidden: string[] = [
        'password',
    ];
}
