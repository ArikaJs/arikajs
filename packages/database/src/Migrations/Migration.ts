
/**
 * Base Migration class
 */
export abstract class Migration {
    /**
     * Run the migrations.
     */
    /**
     * Run the migrations.
     */
    public abstract up(schema?: any): Promise<void>;

    /**
     * Reverse the migrations.
     */
    public abstract down(schema?: any): Promise<void>;
}
