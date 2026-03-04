
import { Job } from './Contracts';

// Base class for Jobs if users prefer inheritance
export abstract class BaseJob implements Job {
    abstract handle(): Promise<void> | void;
}
