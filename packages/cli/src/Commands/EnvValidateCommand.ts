import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export class EnvValidateCommand extends Command {
    public signature = 'env:validate';
    public description = 'Validate the current .env against .env.example';

    public async handle() {
        const cwd = process.cwd();
        const envPath = path.join(cwd, '.env');
        const envExamplePath = path.join(cwd, '.env.example');

        if (!fs.existsSync(envExamplePath)) {
            this.error('No .env.example file found. Cannot validate environment variables.');
            return;
        }

        let envConfig: Record<string, string> = {};
        if (fs.existsSync(envPath)) {
            envConfig = dotenv.parse(fs.readFileSync(envPath));
        }

        const exampleConfig = dotenv.parse(fs.readFileSync(envExamplePath));
        const requiredKeys = Object.keys(exampleConfig);

        const missingKeys: string[] = [];

        for (const key of requiredKeys) {
            // Check if the key exists either in the .env file or the current process.env environment
            if (!(key in envConfig) && process.env[key] === undefined) {
                missingKeys.push(key);
            }
        }

        if (missingKeys.length > 0) {
            this.error('Environment validation failed! The following required variables are missing:');
            missingKeys.forEach(key => {
                this.writeln(`  \x1b[31m- ${key}\x1b[0m (Example: ${exampleConfig[key]})`);
            });
            process.exitCode = 1;
        } else {
            this.success('Environment validation passed. All required variables are present.');
        }
    }
}
