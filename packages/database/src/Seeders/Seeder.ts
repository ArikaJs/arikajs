
import { DatabaseManager } from '../DatabaseManager';

/**
 * Base Seeder class
 */
export abstract class Seeder {
    /**
     * Run the database seeds.
     */
    public abstract run(db: DatabaseManager): Promise<void>;
}
