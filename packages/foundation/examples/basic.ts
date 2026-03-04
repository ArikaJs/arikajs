import { Application, ServiceProvider } from '../src';

/**
 * Example: Basic ArikaJS Foundation Usage
 *
 * This demonstrates the complete lifecycle:
 * 1. Create application with basePath
 * 2. Register service providers
 * 3. Boot the application
 * 4. Run the application
 */

// Define a simple logger service
class Logger {
  constructor(private prefix: string) { }

  log(message: string): void {
    console.log(`[${this.prefix}] ${message}`);
  }
}

// Define a configuration service
interface AppConfig {
  name: string;
  version: string;
  env: string;
}

// Create a core service provider
class CoreServiceProvider extends ServiceProvider {
  register(): void {
    // Register logger as singleton
    this.app.singleton(Logger, () => {
      const config = this.app.config().get('app', {
        name: 'ArikaJS App',
        version: '0.1.0',
        env: 'development',
      } as AppConfig) || {
        name: 'ArikaJS App',
        version: '0.1.0',
        env: 'development',
      };

      return new Logger(config.name);
    });

    // Register app config
    this.app.instance('config.app', {
      name: 'ArikaJS Foundation Example',
      version: '0.1.0',
      env: process.env.NODE_ENV || 'development',
    });
  }

  boot(): void {
    const logger = this.app.resolve<Logger>(Logger);
    logger.log('Core services booted successfully');
  }
}

// Create another provider that depends on the logger
class FeatureServiceProvider extends ServiceProvider {
  register(): void {
    // Register a feature service
    this.app.singleton('feature.service', () => {
      return {
        name: 'Example Feature',
        enabled: true,
      };
    });
  }

  boot(): void {
    // Access logger from another provider
    const logger = this.app.resolve<Logger>(Logger);
    const feature = this.app.resolve<{ name: string; enabled: boolean }>('feature.service');

    logger.log(`Feature "${feature.name}" is ${feature.enabled ? 'enabled' : 'disabled'}`);
  }
}

// Main application entry point
async function main() {
  console.log('🚀 Starting ArikaJS Foundation Example\n');

  // 1. Create application instance
  const app = new Application(__dirname);
  console.log(`📁 Base path: ${app.getBasePath()}\n`);

  // 2. Register service providers
  console.log('📦 Registering service providers...');
  app.register(CoreServiceProvider);
  app.register(FeatureServiceProvider);
  console.log('✅ Providers registered\n');

  // 3. Boot the application
  console.log('🔧 Booting application...');
  await app.boot();
  console.log('✅ Application booted\n');

  // 4. Use services
  console.log('💡 Using services:');
  const logger = app.resolve<Logger>(Logger);
  const config = app.resolve<AppConfig>('config.app');
  const feature = app.resolve<{ name: string; enabled: boolean }>('feature.service');

  logger.log(`Application: ${config.name}`);
  logger.log(`Version: ${config.version}`);
  logger.log(`Environment: ${config.env}`);
  logger.log(`Feature: ${feature.name}\n`);

  // 5. Access configuration
  console.log('⚙️  Configuration access:');
  const appName = app.config().get('app.name', 'Default App');
  console.log(`Config value: ${appName}\n`);

  // 6. Run the application
  console.log('▶️  Running application...');
  await app.run();
  console.log('✅ Application running\n');

  console.log('✨ Example completed successfully!');
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { main };
