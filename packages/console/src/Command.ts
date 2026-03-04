
import { Input } from './Input';
import { Output } from './Output';

export abstract class Command {
    public abstract signature: string;
    public abstract description: string;

    protected input!: Input;
    protected output!: Output;
    protected registry!: any;
    protected container: any;

    public setInput(input: Input) {
        this.input = input;
    }

    public setOutput(output: Output) {
        this.output = output;
    }

    public setRegistry(registry: any) {
        this.registry = registry;
    }

    public setContainer(container: any) {
        this.container = container;
    }

    public abstract handle(): Promise<any> | any;

    /**
     * Optional initialization hook that runs before handle().
     */
    public initialize(): Promise<void> | void {
        // can be overridden
    }

    protected argument(key: string, defaultValue: any = null): any {
        return this.input.argument(key, defaultValue);
    }

    protected option(key: string, defaultValue: any = null): any {
        return this.input.option(key, defaultValue);
    }

    protected info(message: string) {
        this.output.info(message);
    }

    protected error(message: string) {
        this.output.error(message);
    }

    protected warning(message: string) {
        this.output.warning(message);
    }

    protected comment(message: string) {
        this.output.comment(message);
    }

    protected success(message: string) {
        this.output.success(message);
    }

    protected table(headers: string[], rows: any[][]) {
        this.output.table(headers, rows);
    }

    protected async confirm(question: string, defaultAction: boolean = true): Promise<boolean> {
        return await this.output.confirm(question, defaultAction);
    }

    protected async ask(question: string, defaultValue: string | null = null): Promise<string | null> {
        return await this.output.ask(question, defaultValue);
    }

    protected progressStart(total: number) {
        this.output.progressStart(total);
    }

    protected progressAdvance(step: number = 1) {
        this.output.progressAdvance(step);
    }

    protected progressFinish() {
        this.output.progressFinish();
    }

    protected async task(message: string, task: () => Promise<any> | any): Promise<any> {
        return await this.output.task(message, task);
    }

    protected write(message: string) {
        this.output.write(message);
    }

    protected writeln(message: string) {
        this.output.writeln(message);
    }
}
