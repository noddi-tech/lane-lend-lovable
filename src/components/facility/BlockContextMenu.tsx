import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit, Trash2, CornerUpLeft, Copy, Move } from 'lucide-react';
import type { LayoutBlock } from './BlockGridBuilder';

interface BlockContextMenuProps {
  block: LayoutBlock;
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onReturnToLibrary?: () => void;
  onDuplicate?: () => void;
}

export function BlockContextMenu({
  block,
  children,
  onEdit,
  onDelete,
  onReturnToLibrary,
  onDuplicate,
}: BlockContextMenuProps) {
  const canReturnToLibrary = block.type === 'gate' || block.type === 'lane' || block.type === 'station';
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Properties
        </ContextMenuItem>
        
        {onDuplicate && (
          <ContextMenuItem onClick={onDuplicate} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </ContextMenuItem>
        )}
        
        {canReturnToLibrary && onReturnToLibrary && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onReturnToLibrary} className="cursor-pointer">
              <CornerUpLeft className="mr-2 h-4 w-4" />
              Return to Library
            </ContextMenuItem>
          </>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
