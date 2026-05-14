import type { BlitzSyncAdapter } from './SyncAdapter';
import { LocalSyncAdapter } from './LocalSyncAdapter';

let instance: BlitzSyncAdapter | null = null;

/**
 * Get the singleton instance of the sync adapter.
 * For v1, always returns LocalSyncAdapter.
 * In future, this could switch to Firebase based on configuration.
 */
export function getBlitzSyncAdapter(): BlitzSyncAdapter {
  if (!instance) {
    instance = new LocalSyncAdapter();
  }
  return instance;
}

/**
 * Reset the sync adapter for testing.
 * Creates a fresh instance.
 */
export function __resetBlitzSyncAdapterForTests(): void {
  instance = new LocalSyncAdapter();
}

// Re-export types and interfaces
export type { BlitzSyncAdapter, RoomListener } from './SyncAdapter';
export { BlitzSyncError, BlitzSyncErrorCode } from './SyncAdapter';
