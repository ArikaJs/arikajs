export class ObjectPool<T> {
    private pool: T[] = [];
    private factory: () => T;
    private resetFn: (obj: T) => void;

    constructor(factory: () => T, resetFn: (obj: T) => void, initialCapacity = 200) {
        this.factory = factory;
        this.resetFn = resetFn;
        for (let i = 0; i < initialCapacity; i++) {
            this.pool.push(this.factory());
        }
    }

    public acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.factory();
    }

    public release(obj: T): void {
        this.resetFn(obj);
        this.pool.push(obj);
    }
}
