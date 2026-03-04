import { View } from '../src/View';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import assert from 'node:assert';
import { test, before, after } from 'node:test';

const tempDir = path.join(os.tmpdir(), 'arika-view-tests');

before(() => {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
});

after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
});

test('View renders variables and escapes output', async () => {
    const viewsPath = path.join(tempDir, 'variables');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), '<h1>{{ title }}</h1><p>{!! raw !!}</p>');

    const view = new View({ viewsPath });
    const html = await view.render('test', {
        title: '<b>Hello</b>',
        raw: '<span>Safe</span>'
    });

    assert.strictEqual(html.trim(), '<h1>&lt;b&gt;Hello&lt;/b&gt;</h1><p><span>Safe</span></p>');
});

test('View handles conditionals', async () => {
    const viewsPath = path.join(tempDir, 'conditionals');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), '@if (show) Yes @else No @endif');

    const view = new View({ viewsPath });

    assert.strictEqual((await view.render('test', { show: true })).trim(), 'Yes');
    assert.strictEqual((await view.render('test', { show: false })).trim(), 'No');
});

test('View handles loops', async () => {
    const viewsPath = path.join(tempDir, 'loops');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), '<ul>@for (item of items)<li>{{ item }}</li>@endfor</ul>');

    const view = new View({ viewsPath });
    const html = await view.render('test', { items: ['A', 'B'] });

    assert.strictEqual(html.trim(), '<ul><li>A</li><li>B</li></ul>');
});

test('View handles layouts and sections', async () => {
    const viewsPath = path.join(tempDir, 'layouts');
    fs.mkdirSync(viewsPath, { recursive: true });

    fs.writeFileSync(path.join(viewsPath, 'layout.ark.html'), '<html><body>@yield("content")</body></html>');
    fs.writeFileSync(path.join(viewsPath, 'page.ark.html'), '@extends("layout") @section("content") <h1>Hello</h1> @endsection');

    const view = new View({ viewsPath });
    const html = await view.render('page');

    assert.ok(html.includes('<html><body>'));
    assert.ok(html.includes('<h1>Hello</h1>'));
    assert.ok(html.includes('</body></html>'));
});

test('View handles includes', async () => {
    const viewsPath = path.join(tempDir, 'includes');
    fs.mkdirSync(viewsPath, { recursive: true });

    fs.writeFileSync(path.join(viewsPath, 'header.ark.html'), '<header>{{ title }}</header>');
    fs.writeFileSync(path.join(viewsPath, 'page.ark.html'), '@include("header") content');

    const view = new View({ viewsPath });
    const html = await view.render('page', { title: 'Welcome' });

    assert.strictEqual(html.trim(), '<header>Welcome</header> content');
});

test('View uses cache for improved performance', async () => {
    const viewsPath = path.join(tempDir, 'cache');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), 'Cache Me');

    const view = new View({ viewsPath, cache: true });

    // First render - compiles
    await view.render('test');

    // Modify file on disk
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), 'New Content');

    // Second render - should still return old content from cache
    const html = await view.render('test');
    assert.strictEqual(html.trim(), 'Cache Me');
});

test('View loads persistent disk cache', async () => {
    const viewsPath = path.join(tempDir, 'disk-cache-views');
    const cachePath = path.join(tempDir, 'disk-cache-bin');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.mkdirSync(cachePath, { recursive: true });

    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), 'Original Content');

    // 1. First engine - populates disk cache
    const view1 = new View({ viewsPath, cachePath, cache: true });
    await view1.render('test');

    // 2. Second engine - should read from disk cache even if memory is empty
    const view2 = new View({ viewsPath, cachePath, cache: true });

    // Modify original file to prove it's NOT reading from source
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), 'Modified Content');

    const html = await view2.render('test');
    assert.strictEqual(html.trim(), 'Original Content');
});

test('View handles static ${} and backticks safely', async () => {
    const viewsPath = path.join(tempDir, 'escaping-js');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), '<div>${price}</div> `backticks`');

    const view = new View({ viewsPath });
    const html = await view.render('test');

    assert.strictEqual(html.trim(), '<div>${price}</div> `backticks`');
});

test('View supports custom directives', async () => {
    const viewsPath = path.join(tempDir, 'custom-directives');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), '@hello(World)');

    const view = new View({ viewsPath });

    view.directive('hello', (expression) => {
        const name = expression || 'Guest';
        return `_output += "Hello, ${name}!";\n`;
    });

    const html = await view.render('test');
    assert.strictEqual(html.trim(), 'Hello, World!');
});

test('View supports global shared data', async () => {
    const viewsPath = path.join(tempDir, 'shared-data');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), '{{ globalVal }} - {{ localVal }}');

    const view = new View({ viewsPath });
    view.share('globalVal', 'Global');

    assert.strictEqual((await view.render('test', { localVal: 'Local1' })).trim(), 'Global - Local1');
    assert.strictEqual((await view.render('test', { localVal: 'Local2' })).trim(), 'Global - Local2');
});

test('View supports push and stack directives', async () => {
    const viewsPath = path.join(tempDir, 'push-stack');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'test.ark.html'), '@push("scripts")<script>1</script>@endpush @push("scripts")<script>2</script>@endpush Scripts: @stack("scripts")');

    const view = new View({ viewsPath });
    const html = await view.render('test');

    assert.ok(html.includes('<script>1</script>'));
    assert.ok(html.includes('<script>2</script>'));
});

test('View supports unless and empty directives', async () => {
    const viewsPath = path.join(tempDir, 'unless-empty');
    fs.mkdirSync(viewsPath, { recursive: true });
    fs.writeFileSync(path.join(viewsPath, 'unless.ark.html'), '@unless(show) Hidden @endunless');
    fs.writeFileSync(path.join(viewsPath, 'empty.ark.html'), '@empty(items) EmptyArray @endempty @empty(str) EmptyString @endempty');

    const view = new View({ viewsPath });

    assert.strictEqual((await view.render('unless', { show: false })).trim(), 'Hidden');
    assert.strictEqual((await view.render('unless', { show: true })).trim(), '');

    assert.strictEqual((await view.render('empty', { items: [], str: '' })).replace(/\s+/g, ' ').trim(), 'EmptyArray EmptyString');
    assert.strictEqual((await view.render('empty', { items: [1], str: 'A' })).trim(), '');
});

test('View supports components and slots', async () => {
    const viewsPath = path.join(tempDir, 'components');
    fs.mkdirSync(viewsPath, { recursive: true });

    fs.writeFileSync(path.join(viewsPath, 'alert.ark.html'), '<div class="alert {{ type }}"><h1>{!! title !!}</h1><p>{!! slot !!}</p></div>');
    fs.writeFileSync(path.join(viewsPath, 'page.ark.html'), '@component("alert", { type: "danger" }) @slot("title") Error @endslot Something went wrong. @endcomponent');

    const view = new View({ viewsPath });
    const html = await view.render('page');

    assert.ok(html.includes('<div class="alert danger">'));
    assert.ok(html.includes('Error'));
    assert.ok(html.includes('Something went wrong.'));
});

