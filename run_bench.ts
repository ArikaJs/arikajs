import { runBenchmark } from './packages/benchmark/src/index';

async function start() {
    try {
        await runBenchmark({ duration: 3, connections: 100, warmup: 1 });
    } catch (e) {
        console.error(e);
    }
}

start();
