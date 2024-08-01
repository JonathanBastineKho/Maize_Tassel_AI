import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "flowbite-react";
import axios from "axios";

function InterpolationCanvas() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [ctx, setCtx] = useState(null);
    const { result , setResult, folder, canvasImages, setCanvasImages, images, setImages } = useOutletContext();
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [selectedImage, setSelectedImage] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scale, setScale] = useState(1);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleInterpolation = async () => {
        setLoading(true);
        try {
            const tasselCoordinates = canvasImages.flatMap(img => 
                img.prediction
                    .filter(box => {
                        const boxX = img.x + (box.xCenter * img.width / img.element.naturalWidth);
                        const boxY = img.y + (box.yCenter * img.height / img.element.naturalHeight);
                        return (
                            boxX >= 0 && boxX <= canvasSize.width &&
                            boxY >= 0 && boxY <= canvasSize.height
                        );
                    })
                    .map(box => [
                        img.x + (box.xCenter * img.width / img.element.naturalWidth),
                        // Flip the y-coordinate
                        canvasSize.height - (img.y + (box.yCenter * img.height / img.element.naturalHeight))
                    ])
            );

            const data = {
                farm_width: canvasSize.width,
                farm_height: canvasSize.height,
                tassel_coordinates: tasselCoordinates,
                folder_id: folder.id
            };

            const response = await axios.post("/api/ai/interpolate", data);
            setResult(response.data);
        } catch (error) {
            if (error.response.status === 401){
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const drawImages = useCallback(() => {
        if (!ctx || !canvasRef.current) return;
        const canvas = canvasRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvasImages.forEach((img, index) => {
            ctx.drawImage(img.element, img.x, img.y, img.width, img.height);

            // Draw bounding boxes
            if (img.prediction) {
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                img.prediction.forEach(box => {
                    const boxX = img.x + (box.xCenter - box.width / 2) * (img.width / img.element.naturalWidth);
                    const boxY = img.y + (box.yCenter - box.height / 2) * (img.height / img.element.naturalHeight);
                    const boxWidth = box.width * (img.width / img.element.naturalWidth);
                    const boxHeight = box.height * (img.height / img.element.naturalHeight);
                    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
                });
            }

            if (index === selectedImage) {
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.strokeRect(img.x, img.y, img.width, img.height);

                // Draw resize handles
                const handleSize = 8;
                ctx.fillStyle = 'blue';
                ctx.fillRect(img.x - handleSize / 2, img.y - handleSize / 2, handleSize, handleSize);
                ctx.fillRect(img.x + img.width - handleSize / 2, img.y - handleSize / 2, handleSize, handleSize);
                ctx.fillRect(img.x - handleSize / 2, img.y + img.height - handleSize / 2, handleSize, handleSize);
                ctx.fillRect(img.x + img.width - handleSize / 2, img.y + img.height - handleSize / 2, handleSize, handleSize);
            }
        });
    }, [ctx, canvasImages, selectedImage]);

    useEffect(() => {
        drawImages();
    }, [drawImages, canvasSize]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        const imageData = JSON.parse(e.dataTransfer.getData('data'));
        const img = new Image();
        // remove from sidebar
        setImages(images.filter((_, index) => index !== imageData.idx));

        axios.get("/api/service/view-image", {
            params: {
                img_name: imageData.name,
                folder_id: imageData.folder_id
            }
        })
        .then((res) => {
            if (res.status === 200) {
                img.onload = () => {
                    const scaleX = canvas.width / img.width;
                    const scaleY = canvas.height / img.height;
                    const scaleFactor = Math.min(scaleX, scaleY, 1);
                    const scaledWidth = img.width * scaleFactor;
                    const scaledHeight = img.height * scaleFactor;

                    setCanvasImages(prevImages => [...prevImages, {
                        ...imageData,
                        element: img,
                        x: x - scaledWidth / 2,
                        y: y - scaledWidth / 2,
                        width: scaledWidth,
                        height: scaledHeight,
                        prediction: res.data.prediction
                    }]);
                    drawImages();
                };
                img.src = res.data.url;
            }
        });
    }, [setCanvasImages, drawImages, images, scale]);

    const handleMouseDown = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        for (let i = canvasImages.length - 1; i >= 0; i--) {
            const img = canvasImages[i];
            if (x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height) {
                setSelectedImage(i);
                setStartPoint({ x: x - img.x, y: y - img.y });

                // Check if clicked on a resize handle
                const handleSize = 8;
                if (Math.abs(x - img.x) <= handleSize && Math.abs(y - img.y) <= handleSize) {
                    setIsResizing(true);
                    setResizeHandle('topLeft');
                } else if (Math.abs(x - (img.x + img.width)) <= handleSize && Math.abs(y - img.y) <= handleSize) {
                    setIsResizing(true);
                    setResizeHandle('topRight');
                } else if (Math.abs(x - img.x) <= handleSize && Math.abs(y - (img.y + img.height)) <= handleSize) {
                    setIsResizing(true);
                    setResizeHandle('bottomLeft');
                } else if (Math.abs(x - (img.x + img.width)) <= handleSize && Math.abs(y - (img.y + img.height)) <= handleSize) {
                    setIsResizing(true);
                    setResizeHandle('bottomRight');
                } else {
                    setIsDragging(true);
                }
                return;
            }
        }
        setSelectedImage(null);
    }, [canvasImages, scale]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging && !isResizing) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setCanvasImages(prevImages => {
            const newImages = [...prevImages];
            const img = newImages[selectedImage];

            if (isDragging) {
                img.x = x - startPoint.x;
                img.y = y - startPoint.y;
            } else if (isResizing) {
                switch (resizeHandle) {
                    case 'topLeft':
                        img.width += img.x - x;
                        img.height += img.y - y;
                        img.x = x;
                        img.y = y;
                        break;
                    case 'topRight':
                        img.width = x - img.x;
                        img.height += img.y - y;
                        img.y = y;
                        break;
                    case 'bottomLeft':
                        img.width += img.x - x;
                        img.height = y - img.y;
                        img.x = x;
                        break;
                    case 'bottomRight':
                        img.width = x - img.x;
                        img.height = y - img.y;
                        break;
                }
            }
            return newImages;
        });

        drawImages();
    }, [isDragging, isResizing, selectedImage, startPoint, resizeHandle, drawImages, scale]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
    }, []);

    const updateImagePositions = useCallback((oldSize, newSize) => {
        setCanvasImages(prevImages => prevImages.map(img => {
            const scaleX = newSize.width / oldSize.width;
            const scaleY = newSize.height / oldSize.height;
            return {
                ...img,
                x: img.x * scaleX,
                y: img.y * scaleY,
                width: img.width * scaleX,
                height: img.height * scaleY
            };
        }));
    }, [setCanvasImages]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const updateCanvasSize = () => {
            const containerWidth = canvas.offsetWidth;
            let newWidth, newHeight;

            // Calculate height based on 16:9 aspect ratio
            newHeight = Math.floor(containerWidth * (9 / 16));

            // If the calculated height is too tall, base the width on the available height instead
            const maxHeight = window.innerHeight * 0.6;
            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = Math.floor(newHeight * (16 / 9));
            } else {
                newWidth = containerWidth;
            }

            const oldSize = { width: canvas.width, height: canvas.height };
            const newSize = { width: newWidth, height: newHeight };

            canvas.width = newWidth;
            canvas.height = newHeight;
            setCanvasSize(newSize);

            // Calculate and set the scale
            const scaleX = canvas.offsetWidth / newWidth;
            const scaleY = canvas.offsetHeight / newHeight;
            setScale(Math.min(scaleX, scaleY));

            // Update image positions and sizes
            updateImagePositions(oldSize, newSize);
        };

        const context = canvas.getContext('2d');
        setCtx(context);

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, [updateImagePositions]);

    return (
        <div className="mt-24 px-5 max-w-[90rem] mx-auto">
            <div className="flex flex-row justify-between mb-5 items-center">
                <h1 className="text-2xl font-bold">Interpolation Count</h1>
                <Button
                onClick={handleInterpolation} 
                disabled={loading || ((images.length > 0 && canvasImages.length >= 0) || (images.length === 0 && canvasImages.length === 0) )} 
                className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-600">
                    {loading ? 'Loading...' : 'Quick Count' }
                </Button>
            </div>
            <canvas
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="border w-full rounded" 
                ref={canvasRef}
            />
            {result && 
                <>
                <div className="flex flex-row justify-between gap-5 items-center">
                    <div className="flex flex-row items-center justify-between gap-4 mt-5 mb-5">
                        <h1 className="text-2xl font-bold">Total tassel:&nbsp;&nbsp;&nbsp;
                            <span className="text-gray-700 font-normal text-lg">{result?.total_interpolated_tassels}</span>
                        </h1>
                        
                    </div>
                    <Button className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-600">
                        Save Result
                    </Button>
                </div>
                
                <img src={result?.plot_url} className="mx-auto" />
                </>
            }
            

        </div>
    );
}

export default InterpolationCanvas;