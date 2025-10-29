import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    key: string;
    description: string;
  }>;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Panels',
    shortcuts: [
      { key: 'L', description: 'Toggle Library panel' },
      { key: 'P', description: 'Toggle Properties panel' },
      { key: 'Esc', description: 'Deselect / Close panels' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { key: 'Space + Drag', description: 'Pan canvas' },
      { key: '+', description: 'Zoom in' },
      { key: '-', description: 'Zoom out' },
      { key: '0', description: 'Reset zoom (fit to view)' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { key: 'Delete', description: 'Delete selected element' },
      { key: 'Ctrl/Cmd + D', description: 'Duplicate selected element' },
      { key: 'Shift + Drag', description: 'Constrain to axis' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { key: '?', description: 'Show keyboard shortcuts' },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {groupIndex > 0 && <Separator className="mb-4" />}
              
              <h3 className="text-sm font-semibold mb-3 text-foreground">
                {group.title}
              </h3>
              
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs min-w-[60px] justify-center"
                    >
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground">
            💡 <span className="font-medium">Tip:</span> Most shortcuts work when
            you're not typing in an input field. Press{' '}
            <Badge variant="outline" className="font-mono text-[10px] mx-1">
              ?
            </Badge>{' '}
            anytime to view this dialog.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
