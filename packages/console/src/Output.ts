import readline from 'readline';

export class Output {
    protected colors = {
        reset: '\x1b[0m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
        bold: '\x1b[1m'
    };

    public write(message: string) {
        process.stdout.write(message);
    }

    public writeln(message: string) {
        process.stdout.write(message + '\n');
    }

    public info(message: string) {
        this.writeln(`${this.colors.green}${message}${this.colors.reset}`);
    }

    public error(message: string) {
        process.stderr.write(`${this.colors.red}${message}${this.colors.reset}\n`);
    }

    public warning(message: string) {
        this.writeln(`${this.colors.yellow}${message}${this.colors.reset}`);
    }

    public comment(message: string) {
        this.writeln(`${this.colors.gray}${message}${this.colors.reset}`);
    }

    public success(message: string) {
        this.writeln(`${this.colors.green}✔ ${this.colors.reset}${message}`);
    }

    /**
     * Display a table.
     */
    public table(headers: string[], rows: any[][]) {
        if (rows.length === 0) return;

        // Calculate column widths
        const colWidths = headers.map((header, i) => {
            const rowWidths = rows.map(row => String(row[i]).length);
            return Math.max(header.length, ...rowWidths);
        });

        const horizontalLine = ' +' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';

        // Print header
        this.writeln(horizontalLine);
        this.writeln(' | ' + headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ') + ' |');
        this.writeln(horizontalLine);

        // Print rows
        rows.forEach(row => {
            this.writeln(' | ' + row.map((cell, i) => String(cell).padEnd(colWidths[i])).join(' | ') + ' |');
        });

        this.writeln(horizontalLine);
    }

    /**
     * Interactive Confirmation.
     */
    public async confirm(question: string, defaultAction: boolean = true): Promise<boolean> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const suffix = defaultAction ? '[Y/n]' : '[y/N]';

        return new Promise(resolve => {
            rl.question(`${this.colors.bold}${question}${this.colors.reset} ${this.colors.gray}${suffix}${this.colors.reset} `, (answer) => {
                rl.close();
                if (!answer) return resolve(defaultAction);
                resolve(answer.toLowerCase().startsWith('y'));
            });
        });
    }

    /**
     * Ask for input.
     */
    public async ask(question: string, defaultValue: string | null = null): Promise<string | null> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const suffix = defaultValue ? ` (${defaultValue})` : '';

        return new Promise(resolve => {
            rl.question(`${this.colors.bold}${question}${this.colors.reset}${suffix}: `, (answer) => {
                rl.close();
                resolve(answer || defaultValue);
            });
        });
    }

    /**
     * Progress bar support.
     */
    protected progressTotal: number = 0;
    protected progressCurrent: number = 0;

    public progressStart(total: number) {
        this.progressTotal = total;
        this.progressCurrent = 0;
        this.renderProgressBar();
    }

    public progressAdvance(step: number = 1) {
        this.progressCurrent += step;
        this.renderProgressBar();
    }

    public progressFinish() {
        this.progressCurrent = this.progressTotal;
        this.renderProgressBar();
        this.writeln('');
    }

    protected renderProgressBar() {
        const width = 40;
        const progress = Math.min(1, this.progressCurrent / this.progressTotal);
        const filledWidth = Math.round(width * progress);
        const emptyWidth = width - filledWidth;

        const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
        const percentage = Math.round(progress * 100);

        readline.cursorTo(process.stdout, 0);
        process.stdout.write(` ${bar} ${percentage}% (${this.progressCurrent}/${this.progressTotal})`);
    }

    /**
     * Run a task with a status indicator.
     */
    public async task(message: string, task: () => Promise<any> | any): Promise<any> {
        this.write(`${message} ... `);

        try {
            const result = await task();
            readline.cursorTo(process.stdout, message.length + 5);
            this.writeln(`${this.colors.green}DONE${this.colors.reset}`);
            return result;
        } catch (error: any) {
            readline.cursorTo(process.stdout, message.length + 5);
            this.writeln(`${this.colors.red}FAIL${this.colors.reset}`);
            this.error(error.message);
            throw error;
        }
    }
}
