
import { Route } from 'arikajs';

Route.get('/', ({ view }: any) => {
    return view.render('welcome', { name: 'ArikaApp' });
});
