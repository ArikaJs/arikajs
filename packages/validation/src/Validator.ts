import { Rule } from './Rule';
import { ErrorBag } from './ErrorBag';
import { Required } from './Rules/Required';
import { Email } from './Rules/Email';
import { Min } from './Rules/Min';
import { Max } from './Rules/Max';
import { IsString } from './Rules/String';
import { IsNumber } from './Rules/Number';
import { RequiredIf } from './Rules/RequiredIf';
import { In } from './Rules/In';
import { NotIn } from './Rules/NotIn';
import { Alpha } from './Rules/Alpha';
import { AlphaNum } from './Rules/AlphaNum';
import { Url } from './Rules/Url';
import { IsBoolean } from './Rules/Boolean';
import { IsArray } from './Rules/IsArray';
import { Confirmed } from './Rules/Confirmed';

export class Validator {
    private data: Record<string, any>;
    private initialRules: Record<string, string | Rule | (string | Rule)[]>;
    private errorBag: ErrorBag;
    private messages: Record<string, string> = {};
    private customRules: Map<string, Rule> = new Map();
    private validatedData: Record<string, any> = {};

    constructor(
        data: Record<string, any>,
        rules: Record<string, string | Rule | (string | Rule)[]> = {},
        messages: Record<string, string> = {}
    ) {
        this.data = data;
        this.initialRules = rules;
        this.messages = messages;
        this.errorBag = new ErrorBag();

        // Register default rules
        this.customRules.set('required', new Required());
        this.customRules.set('email', new Email());
        this.customRules.set('string', new IsString());
        this.customRules.set('number', new IsNumber());
        this.customRules.set('alpha', new Alpha());
        this.customRules.set('alpha_num', new AlphaNum());
        this.customRules.set('url', new Url());
        this.customRules.set('boolean', new IsBoolean());
        this.customRules.set('array', new IsArray());
    }

    /**
     * Determine if the data passes the validation rules.
     */
    public async validate(): Promise<boolean> {
        this.errorBag = new ErrorBag();
        this.validatedData = {};

        const expandedRules = this.expandRules(this.initialRules);

        for (const [attribute, rules] of Object.entries(expandedRules)) {
            const ruleSet = this.parseRules(rules);
            const value = this.getValue(attribute);

            const isNullable = ruleSet.some(r => (r as any).name === 'nullable');
            const shouldBail = ruleSet.some(r => (r as any).name === 'bail');

            // Handle nullable
            if (isNullable && (value === null || value === undefined)) {
                this.setValidatedValue(attribute, value);
                continue;
            }

            let failed = false;
            for (const item of ruleSet) {
                const { rule, name: ruleName } = item;
                // Skip pseudo-rules
                if (ruleName === 'nullable' || ruleName === 'bail') {
                    continue;
                }

                // If value is null/undefined/empty and rule is NOT 'required' (or similar), skip validation
                if (this.isEmpty(value) && !this.isRequirementRule(rule)) {
                    continue;
                }

                const passes = await rule.validate(value, attribute);

                if (!passes) {
                    const defaultMessage = rule.message();
                    const message = this.formatMessage(defaultMessage, attribute, ruleName);
                    this.errorBag.add(attribute, message);
                    failed = true;

                    if (shouldBail) {
                        break;
                    }
                }
            }

            if (!failed) {
                this.setValidatedValue(attribute, value);
            }
        }

        return this.errorBag.isEmpty();
    }

    private isRequirementRule(rule: Rule): boolean {
        return rule instanceof Required || rule instanceof RequiredIf;
    }

    public async fails(): Promise<boolean> {
        return !(await this.validate());
    }

    public errors(): Record<string, string[]> {
        return this.errorBag.all();
    }

    public validated(): Record<string, any> {
        return this.validatedData;
    }

    /**
     * Register a custom validation rule.
     */
    public extend(name: string, rule: Rule): void {
        this.customRules.set(name, rule);
    }

    private parseRules(rules: string | Rule | (string | Rule)[]): { rule: Rule; name: string }[] {
        let parsed: (string | Rule)[];

        if (typeof rules === 'string') {
            parsed = rules.split('|');
        } else if (Array.isArray(rules)) {
            parsed = rules;
        } else {
            parsed = [rules];
        }

        return parsed.flatMap(r => {
            if (typeof r === 'string') {
                return r.split('|').map(sub => this.createRuleFromString(sub));
            }
            return { rule: r, name: r.constructor.name.toLowerCase() };
        });
    }

    private createRuleFromString(ruleString: string): { rule: Rule; name: string } {
        const [fullRule, ...rest] = ruleString.split(':');
        const name = fullRule.trim();
        const params = rest.length > 0 ? rest.join(':') : '';
        const parameters = params ? params.split(',') : [];

        let rule: Rule;

        switch (name) {
            case 'min':
                rule = new Min(Number(parameters[0]));
                break;
            case 'max':
                rule = new Max(Number(parameters[0]));
                break;
            case 'in':
                rule = new In(parameters);
                break;
            case 'not_in':
                rule = new NotIn(parameters);
                break;
            case 'confirmed':
                rule = new Confirmed(this.data);
                break;
            case 'required_if':
                rule = new RequiredIf(parameters[0], parameters[1], this.data);
                break;
            case 'nullable':
            case 'bail':
                rule = {
                    validate: async () => true,
                    message: () => ''
                } as any;
                break;
            default:
                const registered = this.customRules.get(name);
                if (!registered) {
                    throw new Error(`Validation rule '${name}' not found.`);
                }
                rule = registered;
        }

        return { rule, name };
    }

    private getValue(key: string): any {
        return key.split('.').reduce((o, i) => (o ? o[i] : undefined), this.data);
    }

    private setValidatedValue(path: string, value: any): void {
        const keys = path.split('.');
        let current = this.validatedData;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (i === keys.length - 1) {
                current[key] = value;
            } else {
                current[key] = current[key] || {};
                current = current[key];
            }
        }
    }

    private isEmpty(value: any): boolean {
        return value === null || value === undefined || value === '';
    }

    private formatMessage(defaultMessage: string, attribute: string, ruleName: string): string {
        // Look for exact attribute.rule custom message
        let template = this.messages[`${attribute}.${ruleName}`];

        // Look for general rule custom message
        if (!template) {
            template = this.messages[ruleName];
        }

        // Fallback to default message
        if (!template) {
            template = defaultMessage;
        }

        return template.replace(/:attribute/g, attribute);
    }

    private expandRules(rules: Record<string, any>): Record<string, any> {
        const expanded: Record<string, any> = {};

        for (const [key, rule] of Object.entries(rules)) {
            if (key.includes('*')) {
                this.expandWildcards(key, rule, this.data, expanded);
            } else {
                expanded[key] = rule;
            }
        }

        return expanded;
    }

    private expandWildcards(path: string, rule: any, data: any, expanded: Record<string, any>): void {
        const parts = path.split('.');
        const starIndex = parts.indexOf('*');

        if (starIndex === -1) {
            expanded[path] = rule;
            return;
        }

        const before = parts.slice(0, starIndex).join('.');
        const after = parts.slice(starIndex + 1).join('.');
        const collection = this.getValue(before);

        if (Array.isArray(collection)) {
            for (let i = 0; i < collection.length; i++) {
                const subPath = after ? `${before}.${i}.${after}` : `${before}.${i}`;
                if (subPath.includes('*')) {
                    this.expandWildcards(subPath, rule, data, expanded);
                } else {
                    expanded[subPath] = rule;
                }
            }
        }
    }
}
