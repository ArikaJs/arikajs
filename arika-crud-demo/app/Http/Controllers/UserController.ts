import { Request, Response, Validator, Controller } from 'arikajs';
import { User } from '@Models/User';

export class UserController extends Controller {
    /**
     * Display a listing of the resource.
     */
    public async index(request: Request, response: Response) {
        const users = await User.all();
        return response.json(users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public async store(request: Request, response: Response) {
        const validator = new Validator(request.all(), {
            name: 'required|string|max:255',
            email: 'required|email|unique:users,email',
            password: 'required|string|min:8'
        });

        if (await validator.fails()) {
            return response.json({ errors: validator.errors() }, 422);
        }

        const user = await User.create(validator.validated());
        
        return response.json({
            message: 'User created successfully',
            user
        }, 201);
    }

    /**
     * Display the specified resource.
     */
    public async show(request: Request, response: Response) {
        const id = request.param('id');
        const user = await User.find(id);

        if (!user) {
            return response.json({ message: 'User not found' }, 404);
        }

        return response.json(user);
    }

    /**
     * Update the specified resource in storage.
     */
    public async update(request: Request, response: Response) {
        const id = request.param('id');
        const user = await User.find(id);

        if (!user) {
            return response.json({ message: 'User not found' }, 404);
        }

        const validator = new Validator(request.all(), {
            name: 'string|max:255',
            email: `email|unique:users,email,${id}`,
            password: 'string|min:8'
        });

        if (await validator.fails()) {
            return response.json({ errors: validator.errors() }, 422);
        }

        await user.update(validator.validated());

        return response.json({
            message: 'User updated successfully',
            user
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public async destroy(request: Request, response: Response) {
        const id = request.param('id');
        const user = await User.find(id);

        if (!user) {
            return response.json({ message: 'User not found' }, 404);
        }

        await user.delete();

        return response.json({ message: 'User deleted successfully' });
    }
}
