import { Request, Response } from 'arikajs';
import { User } from '@Models/User';

export class UserController {
    /**
     * Display a listing of the resource.
     */
    async index(req: Request, res: Response) {
        const users = await User.all();
        return res.json({ 
            message: 'List of all users',
            data: users 
        });
    }

    /**
     * Display the specified resource.
     */
    async show(req: Request, res: Response) {
        const id = req.param('id');
        const user = await User.find(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ 
            message: 'User details',
            data: user 
        });
    }

    /**
     * Store a newly created resource.
     */
    async store(req: Request, res: Response) {
        const data = await req.validate({
            name: 'required|string|max:255',
            email: 'required|email|unique:users',
            password: 'required|string|min:8',
        });

        const user = await User.create(data);

        return res.status(201).json({ 
            message: 'User created successfully',
            data: user 
        });
    }

    /**
     * Update the specified resource.
     */
    async update(req: Request, res: Response) {
        const id = req.param('id');
        const user = await User.find(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const data = await req.validate({
            name: 'string|max:255',
            email: `email|unique:users,email,${id}`,
        });

        await user.update(data);

        return res.json({ 
            message: 'User updated successfully',
            data: user 
        });
    }

    /**
     * Remove the specified resource.
     */
    async destroy(req: Request, res: Response) {
        const id = req.param('id');
        const user = await User.find(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.delete();

        return res.json({ message: 'User deleted successfully' });
    }
}
