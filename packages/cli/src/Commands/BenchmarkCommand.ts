import { Command } from '@arikajs/console';
const { runBenchmark } = require('@arikajs/benchmark');

export class BenchmarkCommand extends Command {
    public signature = 'benchmark {--duration=10} {--connections=200} {--warmup=2}';
    public description = 'Run the ArikaJS performance benchmark suite';

    public async handle(): Promise<void> {
        const duration = parseInt((this as any).option('duration') as string) || 10;
        const connections = parseInt((this as any).option('connections') as string) || 200;
        const warmup = parseInt((this as any).option('warmup') as string) || 2;

        try {
            await runBenchmark({ duration, connections, warmup });
        } catch (error: any) {
            (this as any).error(`Benchmark failed: ${error.message}`);
        }
    }
}

