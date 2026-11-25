import { bootRequestHandler, bootWordPress } from '@wp-playground/wordpress';
import type { PHPRequestHandler } from '@php-wasm/universal';

/** Own the returned handler until both WordPress setup and caller validation succeed. */
export async function bootPlayttWordPressRuntime<T>(
  options: Parameters<typeof bootRequestHandler>[0] & Parameters<typeof bootWordPress>[1],
  finish: (handler: PHPRequestHandler) => Promise<T>,
): Promise<T> {
  const handler = await bootRequestHandler(options);
  try {
    await bootWordPress(handler, options);
    return await finish(handler);
  } catch (bootError) {
    try {
      const asyncDispose = (Symbol as unknown as { readonly asyncDispose: symbol }).asyncDispose;
      const dispose = (handler as unknown as Record<symbol, () => Promise<void>>)[asyncDispose];
      await dispose.call(handler);
    } catch (cleanupError) {
      throw new AggregateError([bootError, cleanupError], 'WordPress boot failed and its request handler could not be disposed.', { cause: bootError });
    }
    throw bootError;
  }
}
