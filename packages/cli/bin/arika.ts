#!/usr/bin/env node

import { Bootstrap } from '../src/Bootstrap';

async function run() {
    try {
        const registry = await Bootstrap.boot();
        let args = process.argv.slice(2);

        // Default to 'list' if no command provided or help requested
        if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
            args = ['list'];
        }

        await registry.run(args);
    } catch (error: any) {
        console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
        process.exit(1);
    }
}

run();
