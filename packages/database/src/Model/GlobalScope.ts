/**
 * Interface for a Global Scope applied to every query on a model
 */
export interface GlobalScope {
    /**
     * Apply the scope to the given query builder
     */
    apply(builder: any, model: any): void;
}

/**
 * Registry for global scopes on model classes
 */
export class GlobalScopeRegistry {
    private static scopes: Map<string, Map<string, GlobalScope>> = new Map();

    /**
     * Register a named global scope for a model class
     */
    static register(modelName: string, scopeName: string, scope: GlobalScope): void {
        if (!this.scopes.has(modelName)) {
            this.scopes.set(modelName, new Map());
        }
        this.scopes.get(modelName)!.set(scopeName, scope);
    }

    /**
     * Retrieve all global scopes for a model class
     */
    static getScopes(modelName: string): Map<string, GlobalScope> {
        return this.scopes.get(modelName) ?? new Map();
    }

    /**
     * Remove a specific named scope from a model
     */
    static remove(modelName: string, scopeName: string): void {
        this.scopes.get(modelName)?.delete(scopeName);
    }

    /**
     * Apply all registered global scopes to a query builder
     */
    static applyAll(modelName: string, builder: any, model: any): void {
        const scopes = this.getScopes(modelName);
        for (const scope of scopes.values()) {
            scope.apply(builder, model);
        }
    }

    /**
     * Clear all scopes (useful in tests)
     */
    static flush(modelName?: string): void {
        if (modelName) {
            this.scopes.delete(modelName);
        } else {
            this.scopes.clear();
        }
    }
}

/**
 * A functional scope — can be registered inline without a class
 */
export class CallbackGlobalScope implements GlobalScope {
    private callback: (builder: any, model: any) => void;

    constructor(callback: (builder: any, model: any) => void) {
        this.callback = callback;
    }

    apply(builder: any, model: any): void {
        this.callback(builder, model);
    }
}
