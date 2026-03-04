
import { Repository } from './Repository.js';
import { EnvLoader } from './EnvLoader.js';

let repository: Repository | null = null;

/**
 * Set the global configuration repository.
 */
export function setConfigRepository(repo: Repository): void {
    repository = repo;
}

/**
 * Get/Set configuration values.
 */
export function config<T = any>(key?: string, defaultValue?: T): T | Repository | any {
    if (key === undefined) {
        return repository;
    }

    if (!repository) {
        return defaultValue;
    }

    return repository.get(key, defaultValue);
}

/**
 * Get an environment variable.
 */
export function env<T = any>(key: string, defaultValue?: T): T {
    return EnvLoader.get(key, defaultValue);
}
