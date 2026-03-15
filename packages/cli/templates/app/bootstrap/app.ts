import { createApp } from 'arikajs';
import path from 'path';

const app = createApp(
    path.resolve(__dirname, '../')
);

/*
|--------------------------------------------------------------------------
| Register Service Providers
|--------------------------------------------------------------------------
|
| The service providers listed here will be automatically loaded on the
| request to your application. Feel free to add your own services.
|
*/

import { AppServiceProvider } from '@Providers/AppServiceProvider';
import { RouteServiceProvider } from '@Providers/RouteServiceProvider';

app.register(AppServiceProvider);
app.register(RouteServiceProvider);

/*
|--------------------------------------------------------------------------
| Register The Http Kernel
|--------------------------------------------------------------------------
|
| Next, we need to bind the Http Kernel to the container so that it
| can be resolved when handling requests.
|
*/

import { Kernel } from '@Http/Kernel';
import { Handler } from '@Exceptions/Handler';
import { Kernel as BaseKernel, Handler as BaseHandler } from 'arikajs';

app.singleton(BaseKernel, () => new Kernel(app));
app.singleton(BaseHandler, () => new Handler());

export default app;
