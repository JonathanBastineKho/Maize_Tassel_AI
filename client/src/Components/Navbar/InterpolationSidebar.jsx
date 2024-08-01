import { Avatar, TextInput } from "flowbite-react";
import { FaSearch } from "react-icons/fa";
import { Breadcrumb } from "flowbite-react";
import { HiHome } from "react-icons/hi";
import { FaFolder } from "react-icons/fa";
import { inputTheme } from "../theme";
import { useCallback, useState } from "react";
import axios from "axios";


function InterpolationSidebarContent ({ setResult, images, setImages, folderList, folder, setFolder, setCanvasImages }) {
    const [searchFolder, setSearchFolder] = useState("");
    const [searchImage, setSearchImage] = useState("");
    const fetchImage = useCallback((folder_id) => {
        axios.get("/api/service/search-all-images",
            {
                params: {
                    folder_id: folder_id
                }
            }
        )
        .then((res) => {
            if (res.status === 200){
                setImages(res.data.images);
            }
        })
    }, [folder])
    const handleDragStart = (e, image, folder_id, idx) => {
        e.dataTransfer.setData('data', JSON.stringify({...image, folder_id: folder_id, idx: idx}));
    };
    const handleDoubleClick = (image, folder_id, idx) => {
        const img = new Image();
        setImages(prevImages => prevImages.filter((_, index) => index !== idx));

        axios.get("/api/service/view-image", {
            params: {
                img_name: image.name,
                folder_id: folder_id
            }
        })
        .then((res) => {
            if (res.status === 200) {
                img.onload = () => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / img.width;
                        const scaleY = canvas.height / img.height;
                        const scaleFactor = Math.min(scaleX, scaleY, 0.5); // Limit to 50% of canvas size
                        const scaledWidth = img.width * scaleFactor;
                        const scaledHeight = img.height * scaleFactor;

                        setCanvasImages(prevImages => [...prevImages, {
                            ...image,
                            element: img,
                            x: (canvas.width - scaledWidth) / 2,
                            y: (canvas.height - scaledHeight) / 2,
                            width: scaledWidth,
                            height: scaledHeight,
                            prediction: res.data.prediction
                        }]);
                    }
                };
                img.src = res.data.url;
            }
        });
    };
    return (
        <div className="h-full overflow-y-auto overflow-x-hidden rounded px-3 py-4 w-64">
            {/* BreadCrumb */}
            <Breadcrumb>
                <Breadcrumb.Item className="cursor-pointer" onClick={()=>{setFolder(null); setImages([]); setCanvasImages([]); setSearchImage(""); setResult(null);}} icon={HiHome}>Home</Breadcrumb.Item>
                {folder && (
                    <Breadcrumb.Item>{folder.name}</Breadcrumb.Item>
                )}
            </Breadcrumb>
            {/* Search */}
            <TextInput
                theme={inputTheme}
                className="my-4"
                value={folder === null ? searchFolder : searchImage}
                icon={FaSearch}
                onChange={(e)=>{
                    if (folder === null){
                        setSearchFolder(e.target.value);
                    } else {
                        setSearchImage(e.target.value);
                    }
                }}
                placeholder={folder === null ? 'Search Folders' : 'Search Images'}
            />
            {/* List of folders or images */}
            <div className="flex flex-col gap-2">
                {folder !== null ? (
                    images
                    .filter(image => image.name.toLowerCase().includes(searchImage.toLowerCase()))
                    .map((image, idx) => (
                        <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, image, folder.id, idx)} 
                        onDoubleClick={() => handleDoubleClick(image, folder.id, idx)}
                        key={idx} className="p-2 rounded rounded-lg hover:bg-gray-200 hover:bg-gray-100 cursor-pointer">
                            <div className="flex flex-row items-center justify-between gap-3 w-fit max-w-full">
                                <Avatar size="xs" className="min-w-7 w-7" img={image.thumbnail_url} />
                                <span className="text-gray-700 truncate text-sm">{image.name}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    folderList
                    .filter(fldr => fldr.name.toLowerCase().includes(searchFolder.toLowerCase()))
                    .map((fldr, idx) => (
                      <div 
                      onClick={()=>{setFolder(fldr); fetchImage(fldr.id); setSearchFolder("")}}
                      key={idx} className="p-2 rounded rounded-lg hover:bg-gray-200 hover:bg-gray-100 cursor-pointer">
                        <div className="flex flex-row justify-between gap-3 w-fit">
                            <FaFolder className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-700">{fldr.name}</span>
                        </div>
                      </div>
                    ))
                )}
            </div>
            
        </div>
    );
}

export default InterpolationSidebarContent;