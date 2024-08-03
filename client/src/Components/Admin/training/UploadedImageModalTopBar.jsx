import { HiMenuAlt1 } from "react-icons/hi";
import { Avatar, Label } from "flowbite-react";
import { useNavigate, useParams } from "react-router-dom";
import { IoMdArrowRoundBack, IoMdArrowRoundForward } from "react-icons/io";
import { MdClose } from "react-icons/md";

function UploadedImageModalTopBar ({
    img,
    sideBarOpen,
    setDrawerOpen,
    setSideBarOpen,
    images,
    currIdx,
    setCurrIdx}) {
    const { imageName } = useParams();
    const navigate = useNavigate();
    return (
        <div className="fixed bg-white top-0 left-0 w-screen py-3 px-4 border-b-2 z-20 flex items-center justify-between flex-wrap">
        {/* Left part */}
        <div className="flex flex-row gap-3 items-center">
            <button
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => {
                if (window.innerWidth < 768) {
                setDrawerOpen(true);
                } else {
                setSideBarOpen(!sideBarOpen);
                }
            }}
            >
            <HiMenuAlt1 className="w-6 h-6 text-gray-900" />
            </button>
            <Avatar size="xs" img={img?.thumbnail_url} />
            <Label className="truncate w-24 md:w-52">{imageName}</Label>
        </div>
        {/* Mid part */}
        <div className="bg-gray-100 py-2 px-4 rounded-md flex flex-row justify-between w-40 items-center">
            <button
                disabled={currIdx === 0}
                className={`p-1.5 rounded-md ${
                currIdx === 0 ? "cursor-not-allowed" : "hover:bg-gray-200"
                }`}
                onClick={() => {
                const currentParams = new URLSearchParams(location.search);
                const paramsString = currentParams.toString();
                navigate(`/admin/images/${images[currIdx - 1].folder_id}/${encodeURIComponent(images[currIdx - 1].name)}${paramsString ? `?${paramsString}` : ''}`)
                setCurrIdx(currIdx - 1);
                }}
            >
                <IoMdArrowRoundBack className="text-gray-600" />
            </button>
            <Label>
                {currIdx + 1} / {images.length}
            </Label>
            <button
                disabled={images.length === currIdx+ 1}
                className={`p-1.5 rounded-md ${
                images.length === currIdx + 1
                    ? "cursor-not-allowed"
                    : "hover:bg-gray-200"
                }`}
                onClick={() => {
                    const currentParams = new URLSearchParams(location.search);
                    const paramsString = currentParams.toString();
                    navigate(`/admin/images/${images[currIdx + 1].folder_id}/${encodeURIComponent(images[currIdx + 1].name)}${paramsString ? `?${paramsString}` : ''}`)
                setCurrIdx(currIdx + 1);
                }}
            >
                <IoMdArrowRoundForward className="text-gray-600" />
            </button>
            </div>
            {/* Right part */}
            <button
            className="hover:bg-gray-200 p-2 rounded-md mr-2"
            onClick={() => {
                const currentParams = new URLSearchParams(location.search);
                const paramsString = currentParams.toString();
                navigate(`/admin/images${paramsString ? `?${paramsString}` : ''}`)
            }}
            >
            <MdClose className="w-5 h-5" />
            </button>
        </div>
    );
}

export default UploadedImageModalTopBar;