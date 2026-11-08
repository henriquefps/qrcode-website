/** File Handling API (`file_handlers` in the manifest): files opened with the installed app arrive through `launchQueue`. */
export interface LaunchParamsLike {
  files?: readonly { kind?: string; getFile(): Promise<File> }[];
}

export interface LaunchQueueLike {
  setConsumer(consumer: (params: LaunchParamsLike) => void): void;
}

export function getLaunchQueue(): LaunchQueueLike | undefined {
  return (globalThis as { launchQueue?: LaunchQueueLike }).launchQueue;
}

/** Reads the launched files (skipping directories and unreadable handles) and hands them over. */
export async function filesFromLaunch(params: LaunchParamsLike): Promise<File[]> {
  const files: File[] = [];
  for (const handle of params.files ?? []) {
    if (handle.kind && handle.kind !== 'file') continue;
    try {
      files.push(await handle.getFile());
    } catch {
      // Permission revoked or file gone: skip it.
    }
  }
  return files;
}

/**
 * Registers the consumer. The browser queues launches until a consumer is set, so this may run late
 * (when Read mounts). Unsupported browsers: no-op.
 */
export function consumeLaunchQueue(queue: LaunchQueueLike | undefined, onFiles: (files: File[]) => void): void {
  queue?.setConsumer((params) => {
    void filesFromLaunch(params).then((files) => {
      if (files.length > 0) onFiles(files);
    });
  });
}
