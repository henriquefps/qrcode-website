import { toast } from 'sonner';
import { AUTO_CLEAR_MS, cancelPendingClear, copyWithAutoClear } from '@/lib/clipboard';
import { ClearCountdown } from './ClearCountdown';
import { setSecondsLeft } from './secondsStore';

const CLEAR_TOAST = 'clipboard-auto-clear';
const SECONDS = AUTO_CLEAR_MS / 1000;

function finish(show: () => void) {
  toast.dismiss(CLEAR_TOAST);
  show();
}

/**
 * Copies on a user action. Secrets are cleared from the clipboard after 30 s (see lib/clipboard),
 * with a countdown toast and a "Keep" action. A plain copy replaces any pending clear.
 */
export async function copyText(text: string, { secret = false }: { secret?: boolean } = {}): Promise<boolean> {
  try {
    if (!secret) {
      await navigator.clipboard.writeText(text);
      cancelPendingClear();
      toast.dismiss(CLEAR_TOAST);
      toast.success('Copied to clipboard');
      return true;
    }
    setSecondsLeft(SECONDS);
    await copyWithAutoClear(text, {
      onTick: setSecondsLeft,
      onWaitingForFocus: () => finish(() => toast('The clipboard will be cleared when you come back to this tab', { id: `${CLEAR_TOAST}-wait`, duration: Infinity })),
      onDone: (outcome) => {
        toast.dismiss(`${CLEAR_TOAST}-wait`);
        finish(() => {
          if (outcome === 'cleared') toast.success('Clipboard cleared', { duration: 3000 });
          else if (outcome === 'changed') toast('You copied something else since, so the clipboard was left as is', { duration: 4000 });
          // Safari and Firefox only write to the clipboard during a user action: offer a button.
          else
            toast.error('The browser did not let us clear the clipboard automatically', {
              duration: Infinity,
              action: {
                label: 'Clear now',
                onClick: () => {
                  void navigator.clipboard.writeText('').then(
                    () => toast.success('Clipboard cleared'),
                    () => toast.error('Could not clear the clipboard. Copy something else to replace the secret.'),
                  );
                },
              },
            });
        });
      },
    });
    toast(<ClearCountdown />, {
      id: CLEAR_TOAST,
      duration: Infinity,
      action: {
        label: 'Keep',
        onClick: () => {
          cancelPendingClear();
          toast.success('The clipboard will not be cleared');
        },
      },
    });
    return true;
  } catch {
    toast.error('Could not copy. Select the text and copy it manually.');
    return false;
  }
}
