export interface ParsedSignature {
    name: string;
    arguments: { name: string; required: boolean; default?: any }[];
    options: { name: string; hasValue: boolean; default?: any }[];
}

export class Parser {
    public static parseSignature(signature: string): ParsedSignature {
        const parts = signature.split(/\s+/);
        const name = parts[0];
        const args: { name: string; required: boolean; default?: any }[] = [];
        const options: { name: string; hasValue: boolean; default?: any }[] = [];

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            const match = part.match(/^\{([^}]+)\}$/);
            if (match) {
                let content = match[1];
                let defaultValue: any = undefined;

                if (content.includes('=')) {
                    [content, defaultValue] = content.split('=');
                }

                if (content.startsWith('--')) {
                    const optName = content.substring(2);
                    const isValueOption = part.includes('=');

                    options.push({
                        name: optName,
                        hasValue: isValueOption,
                        default: defaultValue
                    });
                } else {
                    const isOptional = content.endsWith('?');
                    const argName = isOptional ? content.slice(0, -1) : content;

                    args.push({
                        name: argName,
                        required: !isOptional && defaultValue === undefined,
                        default: defaultValue
                    });
                }
            }
        }

        return { name, arguments: args, options };
    }

    public static parseArguments(rawArgs: string[], signature: ParsedSignature) {
        const argsMap = new Map<string, any>();
        const optionsMap = new Map<string, any>();

        // Initialize with defaults
        signature.arguments.forEach(arg => {
            if (arg.default !== undefined) argsMap.set(arg.name, arg.default);
        });

        signature.options.forEach(opt => {
            if (opt.default !== undefined) optionsMap.set(opt.name, opt.default);
        });

        let argIndex = 0;
        for (let i = 0; i < rawArgs.length; i++) {
            const raw = rawArgs[i];

            if (raw.startsWith('--')) {
                const [optName, optValue] = raw.substring(2).split('=');
                if (optValue !== undefined) {
                    optionsMap.set(optName, optValue);
                } else {
                    optionsMap.set(optName, true);
                }
            } else if (argIndex < signature.arguments.length) {
                argsMap.set(signature.arguments[argIndex].name, raw);
                argIndex++;
            }
        }

        return { arguments: argsMap, options: optionsMap };
    }
}
