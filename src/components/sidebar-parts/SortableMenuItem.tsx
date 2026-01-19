import React from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableMenuItemProps {
    id: string;
    label: React.ReactNode;
    isAdmin: boolean;
}

const SortableMenuItem: React.FC<SortableMenuItemProps> = ({ id, label, isAdmin }) => {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled: !isAdmin });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
        cursor: isAdmin ? 'grab' : 'default',
        width: '100%'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...(isMounted ? attributes : {})}
            className="flex items-center w-full group/sortable"
        >
            {isAdmin && (
                <div {...listeners} className="mr-1 p-1 -ml-1 cursor-grab active:cursor-grabbing hover:bg-accent rounded opacity-0 group-hover/sortable:opacity-100 transition-opacity">
                    <GripVertical className="h-3.5 w-3.5 opacity-50 shrink-0" />
                </div>
            )}
            <div className="flex-1">{label}</div>
        </div>
    );
};

export default SortableMenuItem;
