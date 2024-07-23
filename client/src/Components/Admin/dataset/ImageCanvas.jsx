import { useEffect, useRef, useState, useCallback } from "react";

function ImageAdminCanvas({ newBoxToggle, cropData, setCropData, croppingMode, selectedBox, setSelectedBox, sideBarOpen, img, labels, setLabel }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [ctx, setCtx] = useState(null);
    const [image, setImage] = useState(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const [isMovingBox, setIsMovingBox] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [newBoxStart, setNewBoxStart] = useState(null);
    const [isDraggingCrop, setIsDraggingCrop] = useState(false);
    const [cropDragStart, setCropDragStart] = useState(null);
    const [cropResizeHandle, setCropResizeHandle] = useState(null);

    useEffect(() => {
        if (image && !cropData) {
            setCropData({
                x: 0,
                y: 0,
                width: image.width,
                height: image.height
            });
        }
    }, [image, cropData, setCropData]);

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const context = ctx;
        if (!context || !image || !canvas) return;

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
        labels.forEach((box, index) => {
            context.strokeStyle = index === selectedBox ? 'blue' : 'red';
            context.lineWidth = 2 / (scale * scaleFactor);
            const x = box.xCenter - box.width / 2;
            const y = box.yCenter - box.height / 2;
            context.strokeRect(x, y, box.width, box.height);

            // Draw resize handles if box is selected
            if (index === selectedBox) {
                const handleSize = 8 / (scale * scaleFactor);
                context.fillStyle = 'blue';
                context.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
                context.fillRect(x + box.width - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
                context.fillRect(x - handleSize / 2, y + box.height - handleSize / 2, handleSize, handleSize);
                context.fillRect(x + box.width - handleSize / 2, y + box.height - handleSize / 2, handleSize, handleSize);
            }
        });

        if (croppingMode && cropData) {
            context.strokeStyle = 'yellow';
            context.lineWidth = 2 / (scale * scaleFactor);
            context.strokeRect(cropData.x, cropData.y, cropData.width, cropData.height);
            
            // Draw semi-transparent overlay
            context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            context.fillRect(0, 0, image.width, cropData.y);
            context.fillRect(0, cropData.y + cropData.height, image.width, image.height - (cropData.y + cropData.height));
            context.fillRect(0, cropData.y, cropData.x, cropData.height);
            context.fillRect(cropData.x + cropData.width, cropData.y, image.width - (cropData.x + cropData.width), cropData.height);

            // Draw corner squares
            const cornerSize = 10 / (scale * scaleFactor);
            context.fillStyle = 'yellow';
            context.fillRect(cropData.x - cornerSize / 2, cropData.y - cornerSize / 2, cornerSize, cornerSize);
            context.fillRect(cropData.x + cropData.width - cornerSize / 2, cropData.y - cornerSize / 2, cornerSize, cornerSize);
            context.fillRect(cropData.x - cornerSize / 2, cropData.y + cropData.height - cornerSize / 2, cornerSize, cornerSize);
            context.fillRect(cropData.x + cropData.width - cornerSize / 2, cropData.y + cropData.height - cornerSize / 2, cornerSize, cornerSize);
        }

        context.restore();
    }, [ctx, image, labels, scale, offset, sideBarOpen, selectedBox, croppingMode, cropData]);

    const getMousePos = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / image.width;
        const scaleY = canvas.height / image.height;
        const scaleFactor = Math.min(scaleX, scaleY);

        return {
            x: (e.clientX - rect.left - canvas.width / 2 - offset.x) / (scale * scaleFactor) + image.width / 2,
            y: (e.clientY - rect.top - canvas.height / 2 - offset.y) / (scale * scaleFactor) + image.height / 2
        };
    }, [image, offset, scale]);

    const isOverCropHandle = useCallback((x, y) => {
        if (!cropData) return { isOver: false };
        const handleSize = 10 / (scale * Math.min(canvasRef.current.width / image.width, canvasRef.current.height / image.height));
        const handles = [
            { x: cropData.x, y: cropData.y, cursor: 'nwse-resize' },
            { x: cropData.x + cropData.width, y: cropData.y, cursor: 'nesw-resize' },
            { x: cropData.x, y: cropData.y + cropData.height, cursor: 'nesw-resize' },
            { x: cropData.x + cropData.width, y: cropData.y + cropData.height, cursor: 'nwse-resize' }
        ];

        for (let i = 0; i < handles.length; i++) {
            if (Math.abs(x - handles[i].x) < handleSize && Math.abs(y - handles[i].y) < handleSize) {
                return { isOver: true, handle: i, cursor: handles[i].cursor };
            }
        }
        return { isOver: false };
    }, [cropData, image, scale]);

    const isOverResizeHandle = useCallback((x, y, box) => {
        const handleSize = 8 / (scale * Math.min(canvasRef.current.width / image.width, canvasRef.current.height / image.height));
        const handles = [
            { x: box.xCenter - box.width / 2, y: box.yCenter - box.height / 2, cursor: 'nwse-resize' },
            { x: box.xCenter + box.width / 2, y: box.yCenter - box.height / 2, cursor: 'nesw-resize' },
            { x: box.xCenter - box.width / 2, y: box.yCenter + box.height / 2, cursor: 'nesw-resize' },
            { x: box.xCenter + box.width / 2, y: box.yCenter + box.height / 2, cursor: 'nwse-resize' }
        ];

        for (let i = 0; i < handles.length; i++) {
            if (Math.abs(x - handles[i].x) < handleSize && Math.abs(y - handles[i].y) < handleSize) {
                return { isOver: true, handle: i, cursor: handles[i].cursor };
            }
        }
        return { isOver: false };
    }, [image, scale]);
    
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Delete' && selectedBox !== null) {
            setLabel(prevLabels => prevLabels.filter((_, index) => index !== selectedBox));
            setSelectedBox(null);
        }
    }, [selectedBox, setLabel]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

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
        if (img) {
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
        drawCanvas();
    }, [drawCanvas, sideBarOpen]);

    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (canvas && container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                drawCanvas();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [drawCanvas]);

    const handleMouseDown = (e) => {
        const { x, y } = getMousePos(e);

        if (croppingMode && cropData) {
            const { isOver, handle, cursor } = isOverCropHandle(x, y);
            if (isOver) {
                setIsDraggingCrop(true);
                setCropResizeHandle(handle);
                setCropDragStart({ x, y });
                canvasRef.current.style.cursor = cursor;
                return;
            }
        }

        if (newBoxToggle) {
            setNewBoxStart({ x, y });
            return;
        }

        if (selectedBox !== null) {
            const box = labels[selectedBox];
            const { isOver, handle } = isOverResizeHandle(x, y, box);
            if (isOver) {
                setIsResizing(true);
                setResizeHandle(handle);
                return;
            }
        }

        const clickedBox = labels.findIndex(box => 
            x >= box.xCenter - box.width / 2 &&
            x <= box.xCenter + box.width / 2 &&
            y >= box.yCenter - box.height / 2 &&
            y <= box.yCenter + box.height / 2
        );

        if (clickedBox !== -1) {
            setSelectedBox(clickedBox);
            setIsMovingBox(true);
        } else {
            setSelectedBox(null);
            setIsDragging(true);
            setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const handleMouseMove = (e) => {
        const { x, y } = getMousePos(e);

        if (croppingMode && isDraggingCrop && cropData) {
            const dx = x - cropDragStart.x;
            const dy = y - cropDragStart.y;

            setCropData(prevCropData => {
                let newX = prevCropData.x;
                let newY = prevCropData.y;
                let newWidth = prevCropData.width;
                let newHeight = prevCropData.height;

                switch (cropResizeHandle) {
                    case 0: // Top-left
                        newX = Math.min(prevCropData.x + dx, prevCropData.x + prevCropData.width - 10);
                        newY = Math.min(prevCropData.y + dy, prevCropData.y + prevCropData.height - 10);
                        newWidth = prevCropData.width - (newX - prevCropData.x);
                        newHeight = prevCropData.height - (newY - prevCropData.y);
                        break;
                    case 1: // Top-right
                        newY = Math.min(prevCropData.y + dy, prevCropData.y + prevCropData.height - 10);
                        newWidth = Math.max(10, prevCropData.width + dx);
                        newHeight = prevCropData.height - (newY - prevCropData.y);
                        break;
                    case 2: // Bottom-left
                        newX = Math.min(prevCropData.x + dx, prevCropData.x + prevCropData.width - 10);
                        newWidth = prevCropData.width - (newX - prevCropData.x);
                        newHeight = Math.max(10, prevCropData.height + dy);
                        break;
                    case 3: // Bottom-right
                        newWidth = Math.max(10, prevCropData.width + dx);
                        newHeight = Math.max(10, prevCropData.height + dy);
                        break;
                }

                return {
                    x: Math.max(0, Math.min(newX, image.width - newWidth)),
                    y: Math.max(0, Math.min(newY, image.height - newHeight)),
                    width: Math.min(newWidth, image.width - newX),
                    height: Math.min(newHeight, image.height - newY)
                };
            });

            setCropDragStart({ x, y });
            return;
        }

        if (newBoxToggle && newBoxStart) {
            drawCanvas(); // Redraw the canvas to clear previous temporary box
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            const scaleX = canvas.width / image.width;
            const scaleY = canvas.height / image.height;
            const scaleFactor = Math.min(scaleX, scaleY);
            
            context.save();
            context.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
            context.scale(scale * scaleFactor, scale * scaleFactor);
            context.translate(-image.width / 2, -image.height / 2);
            
            context.strokeStyle = 'blue';
            context.lineWidth = 2 / (scale * scaleFactor);
            context.strokeRect(newBoxStart.x, newBoxStart.y, x - newBoxStart.x, y - newBoxStart.y);
            
            context.restore();
            return;
        }

        if (isDragging) {
            setOffset({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            });
        } else if (isMovingBox && selectedBox !== null) {
            const currentBox = labels[selectedBox];
            const halfWidth = currentBox.width / 2;
            const halfHeight = currentBox.height / 2;

            const newX = Math.max(halfWidth, Math.min(x, image.width - halfWidth));
            const newY = Math.max(halfHeight, Math.min(y, image.height - halfHeight));
            
            setLabel(prevLabels => {
                const newLabels = [...prevLabels];
                newLabels[selectedBox] = {
                    ...newLabels[selectedBox],
                    xCenter: newX,
                    yCenter: newY
                };
                return newLabels;
            });
        } else if (isResizing && selectedBox !== null) {
            const currentBox = labels[selectedBox];
            let newWidth, newHeight, newX, newY;

            switch (resizeHandle) {
                case 0: // Top-left
                    newWidth = currentBox.xCenter + currentBox.width / 2 - x;
                    newHeight = currentBox.yCenter + currentBox.height / 2 - y;
                    newX = x + newWidth / 2;
                    newY = y + newHeight / 2;
                    break;
                case 1: // Top-right
                    newWidth = x - (currentBox.xCenter - currentBox.width / 2);
                    newHeight = currentBox.yCenter + currentBox.height / 2 - y;
                    newX = currentBox.xCenter - currentBox.width / 2 + newWidth / 2;
                    newY = y + newHeight / 2;
                    break;
                case 2: // Bottom-left
                    newWidth = currentBox.xCenter + currentBox.width / 2 - x;
                    newHeight = y - (currentBox.yCenter - currentBox.height / 2);
                    newX = x + newWidth / 2;
                    newY = currentBox.yCenter - currentBox.height / 2 + newHeight / 2;
                    break;
                case 3: // Bottom-right
                    newWidth = x - (currentBox.xCenter - currentBox.width / 2);
                    newHeight = y - (currentBox.yCenter - currentBox.height / 2);
                    newX = currentBox.xCenter - currentBox.width / 2 + newWidth / 2;
                    newY = currentBox.yCenter - currentBox.height / 2 + newHeight / 2;
                    break;
            }

            // Ensure minimum size and constrain within image
            newWidth = Math.max(10, Math.min(newWidth, image.width));
            newHeight = Math.max(10, Math.min(newHeight, image.height));
            newX = Math.max(newWidth / 2, Math.min(newX, image.width - newWidth / 2));
            newY = Math.max(newHeight / 2, Math.min(newY, image.height - newHeight / 2));

            setLabel(prevLabels => {
                const newLabels = [...prevLabels];
                newLabels[selectedBox] = {
                    ...newLabels[selectedBox],
                    xCenter: newX,
                    yCenter: newY,
                    width: newWidth,
                    height: newHeight
                };
                return newLabels;
            });
        } else {
            // Change cursor based on hover
            const canvas = canvasRef.current;
            if (selectedBox !== null) {
                const box = labels[selectedBox];
                const { isOver, cursor } = isOverResizeHandle(x, y, box);
                canvas.style.cursor = isOver ? cursor : 'move';
            } else {
                canvas.style.cursor = 'default';
            }
        }
        if (croppingMode && cropData) {
            const { isOver, cursor } = isOverCropHandle(x, y);
            canvasRef.current.style.cursor = isOver ? cursor : 'default';
        }
    };

    const handleMouseUp = (e) => {
        setIsDraggingCrop(false);
        setCropDragStart(null);
        setCropResizeHandle(null);
        if (newBoxToggle && newBoxStart) {
            const { x, y } = getMousePos(e);
            const newBox = {
                xCenter: (newBoxStart.x + x) / 2,
                yCenter: (newBoxStart.y + y) / 2,
                width: Math.abs(x - newBoxStart.x),
                height: Math.abs(y - newBoxStart.y),
            };
            setLabel(prevLabels => [...prevLabels, newBox]);
            setNewBoxStart(null);
            drawCanvas();
            return;
        }
        setIsDragging(false);
        setIsMovingBox(false);
        setIsResizing(false);
        setResizeHandle(null);
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
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
}

export default ImageAdminCanvas;