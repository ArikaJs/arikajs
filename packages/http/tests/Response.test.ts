
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Response } from '../src/Response';

describe('Response', () => {
    it('can set status code', () => {
        const mockRes = { writeHead: () => { }, end: () => { }, setHeader: () => { } } as any;
        const response = new Response(mockRes);
        response.status(201);
        assert.strictEqual(response.getStatusCode(), 201);
    });

    it('can set headers', () => {
        const headers: Record<string, string> = {};
        const mockRes = {
            setHeader: (name: string, value: string) => { headers[name] = value; },
            writeHead: () => { },
            end: () => { }
        } as any;
        const response = new Response(mockRes);
        response.header('Content-Type', 'text/plain');
        response.terminate(); // terminate calls flush() which sets headers
        assert.strictEqual(headers['Content-Type'], 'text/plain');
    });

    it('can send JSON responses', () => {
        let sentContent = '';
        const mockRes = {
            setHeader: () => { },
            writeHead: () => { },
            end: (content: string) => { sentContent = content; }
        } as any;
        const response = new Response(mockRes);
        response.json({ success: true });
        response.terminate();
        assert.strictEqual(sentContent, JSON.stringify({ success: true }));
    });
});
