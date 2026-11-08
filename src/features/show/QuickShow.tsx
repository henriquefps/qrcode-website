import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ResponsiveDialog';

interface QuickShowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Placeholder: becomes the full-screen overlay that turns pasted text into a huge QR code. */
export function QuickShow({ open, onOpenChange }: QuickShowProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Quick show</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Paste a password or link and show it as a large QR code.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="text-muted-foreground">Coming soon.</ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
