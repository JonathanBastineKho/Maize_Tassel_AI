import { useEffect, useRef, useState, useCallback } from "react";

function ImageUserCanvas({ sideBarOpen, img, labels, color = 'red', showBox = true, showConfidence = false }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [ctx, setCtx] = useState(null);
    const [image, setImage] = useState(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const context = ctx;
        if (!context || !image || !canvas) return;

        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;

        context.clearRect(0, 0, canvas.width, canvas.height);
    
        const scaleX = canvas.width / image.width;
        const scaleY = canvas.height / image.height;
        const scaleFactor = Math.min(scaleX, scaleY);
        
        context.save();
        context.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
        context.scale(scale * scaleFactor, scale * scaleFactor);
        context.translate(-image.width / 2, -image.height / 2);

        context.drawImage(image, 0, 0);

        // Draw bounding boxes
        if (showBox) {
            context.strokeStyle = color;
            context.lineWidth = 2 / (scale * scaleFactor);
            context.fillStyle = 'white';
            context.font = `${12 / (scale * scaleFactor)}px Arial`;

            labels.forEach(box => {
                const x = box.xCenter - box.width / 2;
                const y = box.yCenter - box.height / 2;
                context.strokeRect(x, y, box.width, box.height);

                if (showConfidence) {
                    const confidence = (box.confidence * 100).toFixed(2) + '%';
                    const textWidth = context.measureText(confidence).width;
                    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    context.fillRect(x, y, textWidth + 4, 20 / (scale * scaleFactor));
                    context.fillStyle = 'white';
                    context.fillText(confidence, x + 2, y + 14 / (scale * scaleFactor));
                }
            });
        }

        context.restore();
    }, [ctx, image, labels, scale, offset, sideBarOpen, color, showBox, showConfidence]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (canvas && container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            const context = canvas.getContext('2d');
            setCtx(context);
        }
    }, [sideBarOpen]);

    useEffect(() => {
        if (img && img.url) {
            const imgObj = new Image();
            imgObj.src = img.url;
            imgObj.onload = () => {
                setImage(imgObj);
            };
        } else {
            setImage(null);
        }
    }, [img]);

    useEffect(() => {
        if (image) {
            drawCanvas();
        }
    }, [drawCanvas, image, sideBarOpen]);

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && containerRef.current) {
                drawCanvas();
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [drawCanvas]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prevScale => Math.min(Math.max(prevScale * delta, 0.1), 5));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            return () => canvas.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    return (
        <div ref={containerRef} className="w-full h-screen">
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
}

export default ImageUserCanvas;