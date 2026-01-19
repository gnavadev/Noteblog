export interface PostItData {
    id: string;
    user_id: string;
    content: string;
    drawing_data: any[];
    position_x: number;
    position_y: number;
    color: string;
}

export interface PostItBoardProps {
    user: any;
    isAdmin: boolean;
}

export type PostItTool = 'text' | 'pencil' | 'eraser';

export interface DrawingCanvasHandle {
    undo: () => void;
    redo: () => void;
}

export const POSTIT_COLORS = [
    '#fff740', // Yellow
    '#ff7eb9', // Pink
    '#7afcff', // Blue
    '#feff9c', // Light Yellow
    '#ff9e9e', // Light Red
    '#9eff9e', // Light Green
];
