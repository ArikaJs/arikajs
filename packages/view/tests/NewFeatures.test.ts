import { View } from '../src/View';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import assert from 'node:assert';
import { test, before, after } from 'node:test';

const tempDir = path.join(os.tmpdir(), 'arika-new-features-tests');

before(() => {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
});

after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
});

test('View supports Streaming SSR', async () => {
    const viewsPath = path.join(tempDir, 'streaming');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), 'Header... @for(i of [1,2,3]) {{ i }} @endfor ...Footer');

    const view = new View({ viewsPath });
    const stream = await view.stream('test');
    
    let result = '';
    for await (const chunk of stream as any) {
        result += chunk.toString();
    }

    assert.ok(result.includes('Header...'));
    assert.ok(result.includes('1'));
    assert.ok(result.includes('2'));
    assert.ok(result.includes('3'));
    assert.ok(result.includes('...Footer'));
});

test('View handles SEO Meta & Head directives', async () => {
    const viewsPath = path.join(tempDir, 'seo');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), 
        '@meta({ title: "Page Title", description: "Page Desc" }) <html><head> @head </head><body>Content</body></html>'
    );

    const view = new View({ viewsPath });
    const html = await view.render('test');

    assert.ok(html.includes('<title>Page Title</title>'));
    assert.ok(html.includes('<meta name="description" content="Page Desc">'));
    assert.ok(html.includes('<meta property="og:title" content="Page Title">'));
});

test('View renders Error Overlay in dev mode', async () => {
    const viewsPath = path.join(tempDir, 'errors');
    fs.mkdirSync(viewsPath, { recursive: true });
    // This template will throw a ReferenceError because 'undefinedVar' is not defined
    fs.writeFileSync(path.join(viewsPath, 'fail.ark.html'), '<h1>{{ undefinedVar.something }}</h1>');

    const view = new View({ viewsPath, dev: true });
    const html = await view.render('fail');

    assert.ok(html.includes('arika-error-overlay'));
    assert.ok(html.includes('Template Error'));
    assert.ok(html.includes('undefinedVar'));
    assert.ok(html.includes('fail.ark.html'));
});

test('View maps errors to original line numbers', async () => {
    const viewsPath = path.join(tempDir, 'source-mapping');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'mapping.ark.html'), 
        'Line 1\nLine 2\nLine 3 with {{ errorVar.prop }}\nLine 4'
    );

    const view = new View({ viewsPath, dev: true });
    const html = await view.render('mapping');

    assert.ok(html.includes('arika-error-overlay'));
    assert.ok(html.includes('line 3')); // Check if our parser/generator successfully tagged line 3
});
