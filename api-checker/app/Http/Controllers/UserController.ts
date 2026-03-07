export class UserController {
    /**
     * Display a listing of the resource.
     */
    async index(req: any, res: any) {
        return res.json({ message: 'List all users' });
    }

    /**
     * Display the specified resource.
     */
    async show(req: any, res: any) {
        return res.json({ message: `Show user ${req.params.id}` });
    }

    /**
     * Store a newly created resource.
     */
    async store(req: any, res: any) {
        return res.json({ message: 'User created' }, 201);
    }

    /**
     * Update the specified resource.
     */
    async update(req: any, res: any) {
        return res.json({ message: `User ${req.params.id} updated` });
    }

    /**
     * Remove the specified resource.
     */
    async destroy(req: any, res: any) {
        return res.json({ message: `User ${req.params.id} deleted` });
    }
}
