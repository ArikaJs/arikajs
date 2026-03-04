
import test, { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Queue, QueueManager, BaseJob } from '../src';

class TestJob extends BaseJob {
    static executed = false;
    static params: any = null;

    constructor(public data: any) {
        super();
    }

    async handle() {
        TestJob.executed = true;
        TestJob.params = this.data;
    }
}

describe('Queue', () => {
    before(() => {
        const config = {
            default: 'sync',
            connections: {
                sync: { driver: 'sync' }
            }
        };

        const manager = new QueueManager(config);
        Queue.setManager(manager);
    });

    it('dispatches job synchronously', async () => {
        TestJob.executed = false;

        await Queue.dispatch(new TestJob({ id: 123 }));

        assert.ok(TestJob.executed, 'Job should have been executed');
        assert.strictEqual(TestJob.params.id, 123);
    });
});
