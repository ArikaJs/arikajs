/**
 * Lifecycle events that can be observed on a Model
 */
export type ObserverEvent =
    | 'creating'
    | 'created'
    | 'updating'
    | 'updated'
    | 'saving'
    | 'saved'
    | 'deleting'
    | 'deleted'
    | 'restoring'
    | 'restored';

/**
 * Observer interface — implement any subset of lifecycle hooks
 */
export interface ModelObserver {
    creating?(model: any): Promise<void> | void;
    created?(model: any): Promise<void> | void;
    updating?(model: any): Promise<void> | void;
    updated?(model: any): Promise<void> | void;
    saving?(model: any): Promise<void> | void;
    saved?(model: any): Promise<void> | void;
    deleting?(model: any): Promise<void> | void;
    deleted?(model: any): Promise<void> | void;
    restoring?(model: any): Promise<void> | void;
    restored?(model: any): Promise<void> | void;
}

/**
 * Central registry for model observers
 */
export class ObserverRegistry {
    private static observers: Map<string, ModelObserver[]> = new Map();

    /**
     * Register an observer for a given model class name
     */
    static register(modelName: string, observer: ModelObserver): void {
        if (!this.observers.has(modelName)) {
            this.observers.set(modelName, []);
        }
        this.observers.get(modelName)!.push(observer);
    }

    /**
     * Fire a lifecycle event for a given model
     * Returns false if any observer explicitly returns false (cancels the action)
     */
    static async fire(modelName: string, event: ObserverEvent, model: any): Promise<boolean> {
        const list = this.observers.get(modelName) ?? [];

        for (const observer of list) {
            const handler = (observer as any)[event];
            if (typeof handler === 'function') {
                const result = await handler.call(observer, model);
                if (result === false) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Remove all observers for a model
     */
    static flush(modelName?: string): void {
        if (modelName) {
            this.observers.delete(modelName);
        } else {
            this.observers.clear();
        }
    }
}
