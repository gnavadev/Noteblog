import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    color: string;
    width: number;
    tool: 'pencil' | 'eraser';
}

interface DrawingCanvasProps {
    initialData?: Stroke[];
    onChange?: (data: Stroke[]) => void;
    tool: 'pencil' | 'eraser';
    color?: string;
    lineWidth?: number;
    readOnly?: boolean;
    className?: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    initialData = [],
    onChange,
    tool,
    color = '#000000',
    lineWidth = 2,
    readOnly = false,
    className = ""
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>(initialData);
    const currentStrokeRef = useRef<Point[]>([]);

    // Initialize canvas with strokes
    const drawStrokes = useCallback((ctx: CanvasRenderingContext2D, strokesToDraw: Stroke[]) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        strokesToDraw.forEach(stroke => {
            if (stroke.points.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

            // Set composition for eraser
            if (stroke.tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = stroke.width * 5; // Larger eraser
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }

            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Scale for high DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        drawStrokes(ctx, strokes);
    }, [strokes, drawStrokes]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly) return;
        setIsDrawing(true);
        const point = getPoint(e);
        currentStrokeRef.current = [point];

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = lineWidth * 5;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || readOnly) return;
        const point = getPoint(e);
        currentStrokeRef.current.push(point);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    };

    const endDrawing = () => {
        if (!isDrawing || readOnly) return;
        setIsDrawing(false);

        const newStroke: Stroke = {
            points: [...currentStrokeRef.current],
            color: color,
            width: lineWidth,
            tool: tool
        };

        const updatedStrokes = [...strokes, newStroke];
        setStrokes(updatedStrokes);
        onChange?.(updatedStrokes);
        currentStrokeRef.current = [];
    };

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full cursor-crosshair touch-none ${className}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
        />
    );
};

export default DrawingCanvas;
