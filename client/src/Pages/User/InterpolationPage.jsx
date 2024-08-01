import { Outlet, useNavigate } from "react-router-dom";
import UserNavbar from "../../Components/Navbar/UserNavbar";
import { useEffect, useState } from "react";
import { Drawer } from "flowbite-react";
import InterpolationSidebarContent from "../../Components/Navbar/InterpolationSidebar";
import axios from "axios";

function InterpolationPage() {
    const navigate = useNavigate();
    const [folder, setFolder] = useState(null);
    const [images, setImages] = useState([]);
    const [result, setResult] = useState(null);
    const [canvasImages, setCanvasImages] = useState([]);
    const [folderList, setFolderList] = useState([]);
    const [collapsed, setCollapsed] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(()=>{
        if (folderList.length === 0){
            axios.get("/api/service/search-all-folders-indiv")
            .then((res) => {
                if (res.status === 200) {
                    setFolderList(res.data.folder_list);
                }
            })
            .catch((err) => {
                if (err.response.status === 401){
                    navigate("/login");
                }
            })
        }
    }, [])

    return (
        <>
            <UserNavbar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                onDrawerToggle={() => setIsDrawerOpen(!isDrawerOpen)}
            />
            <div className="flex">
                {/* SideBar */}
                <div className={`hidden md:block md:mr-[16.3rem]`}>
                    <nav className="h-screen border-r fixed pt-20 bg-white">
                        <InterpolationSidebarContent setResult={setResult} setCanvasImages={setCanvasImages} images={images} setImages={setImages} folderList={folderList} folder={folder} setFolder={setFolder} />
                    </nav>
                </div>
                {/* Canvas Content */}
                <div className="w-full flex-grow transition-all duration-100 ease-in-out">
                    <Outlet context={{
                        result,
                        setResult,
                        folder,
                        canvasImages,
                        setCanvasImages,
                        images,
                        setImages
                        }} />
                </div>
                {/* Drawer */}
                <div className="md:hidden">
                    <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} >
                        <Drawer.Items className="pt-14">
                            <InterpolationSidebarContent setResult={setResult} setCanvasImages={setCanvasImages} images={images} setImages={setImages} folderList={folderList} folder={folder} setFolder={setFolder} />
                        </Drawer.Items>
                    </Drawer>
                </div>
                
            </div>
            
        </>
    );
}

export default InterpolationPage;