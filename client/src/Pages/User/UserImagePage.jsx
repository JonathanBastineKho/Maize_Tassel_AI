import { Button, TextInput } from "flowbite-react";
import { HiSearch } from "react-icons/hi";
import { FaTrashAlt, FaFilter, FaFolderPlus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { inputTheme } from "../../Components/theme";
import BreadcrumbFolder from "../../Components/User/BreadCrumbFolder";
import UserImageTable from "../../Components/User/UserImageTable";
import UploadModal from "../../Components/User/UserUploadModal";
import DeleteImageModal from "../../Components/User/DeleteImageModal";

function UserImagePage() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [breadCrumbfolder, setBreadCrumbFolder] = useState([]); // BreadCrumb folders
  const [folder, setFolder] = useState([]); // Folder in the search
  const [image, setImage] = useState({ item: new Map() }); // Images in the search
  const [imageToAction, setImageToAction] = useState(null); // Images to view, edit, delete, etc

  const location = useLocation();
  const { folderId } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchValue = searchParams.get("search") || "";

  const [inputValue, setInputValue] = useState(searchValue);
  const timeoutRef = useRef(null);
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
  
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  
    timeoutRef.current = setTimeout(() => {
      let url = "/user/images";
      if (folderId) {
        url += `/${folderId}`;
      }
      url += `?search=${encodeURIComponent(value)}`; // Use the 'value' variable here
      navigate(url);
    }, 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      let url = "/user/images";
      if (folderId) {
        url += `/${folderId}`;
      }
      url += `?search=${encodeURIComponent(inputValue)}`;
      navigate(url);
    }
  };

  return (
    <div className="px-5 mt-24 flex flex-col gap-5">
      <DeleteImageModal
        setImageList={setImage}
        setImageToDelete={setImageToAction}
        imageToDelete={imageToAction}
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
      />
      <UploadModal
        className="w-screen h-screen"
        setImage={setImage}
        folder={breadCrumbfolder[breadCrumbfolder.length - 1]}
        open={uploadModalOpen}
        setOpen={setUploadModalOpen}
      />
      <BreadcrumbFolder
        folder={breadCrumbfolder}
        setFolder={setBreadCrumbFolder}
      />
      <h2 className="font-bold text-2xl">Your Images</h2>
      <div className="flex flex-wrap flex-row justify-between">
        <div className="flex flex-row items-center gap-4">
          <TextInput
            className="w-96"
            placeholder="Search your image"
            icon={HiSearch}
            theme={inputTheme}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <div className="flex flex-row gap-1">
            <button className="hover:bg-gray-100 p-2 rounded-md">
              <FaTrashAlt className="w-5 h-5 text-gray-500" />
            </button>
            <button className="hover:bg-gray-100 p-2 rounded-md">
              <FaFilter className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex flex-row gap-3">
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-700 items-center flex"
          >
            <span className="flex items-center mr-2">
              <FaPlus />
            </span>
            <span>Upload</span>
          </Button>
          <Button className="" color="light">
            <span className="flex items-center mr-2">
              <FaFolderPlus className="text-gray-500 w-4 h-4" />
            </span>
            <span>Create Folder</span>
          </Button>
        </div>
      </div>
      <UserImageTable
        setDeleteModalOpen={setDeleteModalOpen}
        setImageToAction={setImageToAction}
        image={image}
        setImage={setImage}
        folder={folder}
        setFolder={setFolder}
        breadCrumbfolder={breadCrumbfolder}
      />
    </div>
  );
}

export default UserImagePage;
