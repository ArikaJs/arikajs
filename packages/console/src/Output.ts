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
    protected progressMessage: string = '';

    public progressStart(total: number, message: string = '') {
        this.progressTotal = total;
        this.progressCurrent = 0;
        this.progressMessage = message;
        this.renderProgressBar();
    }

    public progressAdvance(step: number = 1, message: string = '') {
        this.progressCurrent += step;
        if (message) this.progressMessage = message;
        this.renderProgressBar();
    }

    public progressFinish(message: string = '') {
        this.progressCurrent = this.progressTotal;
        if (message) this.progressMessage = message;
        this.renderProgressBar();
        this.writeln('');
    }

    protected renderProgressBar() {
        const width = 40;
        const progress = Math.min(1, this.progressTotal > 0 ? this.progressCurrent / this.progressTotal : 0);
        const filledWidth = Math.round(width * progress);
        const emptyWidth = width - filledWidth;

        const bar = '●'.repeat(filledWidth) + '○'.repeat(emptyWidth);
        const percentage = Math.round(progress * 100);

        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
        process.stdout.write(` ${this.colors.cyan}${bar}${this.colors.reset} ${this.colors.bold}${percentage}%${this.colors.reset} ${this.colors.gray}${this.progressMessage}${this.colors.reset}`);
    }

    /**
     * Spinner support.
     */
    protected spinnerIndex = 0;
    protected spinnerTimer: any = null;
    protected spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    protected spinnerMessage = '';

    protected startSpinner(message: string) {
        this.spinnerMessage = message;
        this.spinnerIndex = 0;
        this.spinnerTimer = setInterval(() => {
            const frame = this.spinnerFrames[this.spinnerIndex];
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`${this.colors.cyan}${frame}${this.colors.reset} ${message} ... `);
            this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
        }, 80);
    }

    protected stopSpinner(success: boolean) {
        if (this.spinnerTimer) {
            clearInterval(this.spinnerTimer);
            this.spinnerTimer = null;
        }

        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);

        if (success) {
            this.writeln(`${this.colors.green}✔${this.colors.reset} ${this.spinnerMessage} ${this.colors.green}DONE${this.colors.reset}`);
        } else {
            this.writeln(`${this.colors.red}✖${this.colors.reset} ${this.spinnerMessage} ${this.colors.red}FAIL${this.colors.reset}`);
        }
    }

    /**
     * Run a task with a status indicator.
     */
    public async task(message: string, task: () => Promise<any> | any): Promise<any> {
        this.startSpinner(message);

        try {
            const result = await task();
            this.stopSpinner(true);
            return result;
        } catch (error: any) {
            this.stopSpinner(false);
            this.error(error.message);
            throw error;
        }
    }
}
