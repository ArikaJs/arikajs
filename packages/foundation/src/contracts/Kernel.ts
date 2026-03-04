/**
 * Kernel contract for ArikaJS.
 *
 * Kernels are responsible for handling requests in different contexts:
 * - HTTP kernel handles web requests
 * - CLI kernel handles command-line commands
 * - Queue kernel handles background jobs
 *
 * Foundation only defines the contract - implementations live in
 * higher-level packages like @arikajs/http, @arikajs/cli, etc.
 */
export interface Kernel {
  /**
   * Bootstrap the kernel.
   * Called once when the kernel is initialized.
   */
  bootstrap(): Promise<void> | void;

  /**
   * Handle a request/command/job.
   * The exact signature depends on the kernel type.
   */
  handle(...args: any[]): Promise<any> | any;
}
