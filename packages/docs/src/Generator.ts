import { ParsedRoute } from './types';
import { PostmanGenerator } from './PostmanGenerator';
import { MarkdownGenerator } from './MarkdownGenerator';
import { HtmlGenerator } from './HtmlGenerator';
import { OpenApiGenerator } from './OpenApiGenerator';
import fs from 'fs';
import path from 'path';

export class DocumentationGenerator {
    /**
     * Generate all documentation formats based on parsed routes.
     */
    public generateAll(routes: ParsedRoute[], appName: string, outputDir: string, options: { baseUrl?: string } = {}): void {
        const baseUrl = options.baseUrl || 'http://localhost:3000';

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate Postman Environment
        const envJson = {
            name: `${appName} Env`,
            values: [
                { key: "base_url", value: baseUrl, enabled: true },
                { key: "token", value: "", enabled: true }
            ]
        };
        const envContent = JSON.stringify(envJson, null, 2);
        fs.writeFileSync(path.join(outputDir, 'postman_environment.json'), envContent);

        // Generate Postman Collection
        const postmanGenerator = new PostmanGenerator();
        const postmanJson = postmanGenerator.generate(routes, appName, baseUrl);
        const postmanContent = JSON.stringify(postmanJson, null, 2);
        fs.writeFileSync(path.join(outputDir, 'postman_collection.json'), postmanContent);

        // Generate OpenAPI Spec
        const openApiGenerator = new OpenApiGenerator();
        const openApiJson = openApiGenerator.generate(routes, appName, baseUrl);
        const openApiContent = JSON.stringify(openApiJson, null, 2);
        fs.writeFileSync(path.join(outputDir, 'openapi.json'), openApiContent);

        // Generate Markdown
        const markdownGenerator = new MarkdownGenerator();
        const markdownContent = markdownGenerator.generate(routes, appName, baseUrl);
        fs.writeFileSync(path.join(outputDir, 'DOCS.md'), markdownContent);

        // Generate HTML with embedded JSONs
        const htmlGenerator = new HtmlGenerator();
        const htmlContent = htmlGenerator.generate(routes, appName, baseUrl, {
            postmanContent,
            envContent,
            openApiContent
        });
        fs.writeFileSync(path.join(outputDir, 'api_docs.html'), htmlContent);
    }
}
