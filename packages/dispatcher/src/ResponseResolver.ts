import { Response } from './Contracts/Http';
import { Stream } from 'stream';

export class ResponseResolver {
    /**
     * Resolve and normalize the handler return value into a Response object.
     */
    public async resolve(value: any, response: Response): Promise<Response> {
        // Handle null or undefined (empty response)
        if (value === null || value === undefined) {
            return response.status(204).send('');
        }

        // Output of a View or object with a render() method
        if (typeof value.render === 'function') {
            const rendered = await value.render();
            return response.send(rendered);
        }

        // If it's a native stream, map to the response's stream handler if supported
        if (value instanceof Stream) {
            if (typeof response.stream === 'function') {
                return response.stream(value);
            }
            // fallback, assuming some other mechanism handles it
            return value as any;
        }

        // If it's already a Response object (basic duck typing check for framework response)
        if (typeof value.send === 'function' && typeof value.status === 'function') {
            return value;
        }

        if (typeof value === 'object' && value !== null) {
            return response.json(value);
        }

        // If it's a string, return as text or buffer
        if (typeof value === 'string' || Buffer.isBuffer(value)) {
            return response.send(value);
        }

        // Default to string conversion
        return response.send(String(value));
    }
}
