import { Button, TextInput } from "flowbite-react";
import { HiSearch } from "react-icons/hi";
import { FaTrashAlt, FaFilter, FaFolderPlus, FaCheck } from "react-icons/fa";
import { HiExclamation } from "react-icons/hi";
import { FaPlus } from "react-icons/fa6";
import { useState, useRef, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { inputTheme } from "../../Components/theme";
import BreadcrumbFolder from "../../Components/User/BreadCrumbFolder";
import UserImageTable from "../../Components/User/UserImageTable";
import UploadModal from "../../Components/User/UserUploadModal";
import DeleteImageModal from "../../Components/User/DeleteImageModal";
import FilterModal from "../../Components/User/FilterModal";
import ToastMsg from "../../Components/Other/ToastMsg";
import { AuthContext } from "../../Components/Authentication/AuthContext";
import UserNewFolderModal from "../../Components/User/UserNewFolderModal";
import BulkUploadModal from "../../Components/User/BulkUploadModal";
import { StorageContext } from "../../Components/Navbar/StorageContext";
import DeleteFolderModal from "../../Components/User/DeleteFolderModal";
import RenameFolderModal from "../../Components/User/RenameFolderModal";
import RenameImageModal from "../../Components/User/RenameImageModal";

function AdminImagePage() {
  const { user } = useContext(AuthContext);

  const [folder, setFolder] = useState([]); // Folder in the search
  const [image, setImage] = useState({ item: new Map() }); // Images in the search
  const [imageToAction, setImageToAction] = useState(null); // Images to view, edit, delete, etc
  const [folderToAction, setFolderToAction] = useState(null); // Folder to edit, delete, etc
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Toast message
  const [premiumWarning, setpPremiumWarning] = useState(false); // toast for premium
  const [fullStorage, setFullStorage] = useState(false); // toast for full storage
  const [bulkUploadMsg, setBulkUploadMsg] = useState(false); // successful bulk upload msg

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
      let url = "/admin/images";
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
      let url = "/admin/images";
      if (folderId) {
        url += `/${folderId}`;
      }
      url += `?search=${encodeURIComponent(inputValue)}`;
      navigate(url);
    }
  };

  return (
    <div className="px-5 mt-24 flex flex-col gap-5">
      <h2 className="font-bold text-2xl">Uploaded Images</h2>
      <div className="flex flex-wrap flex-row justify-between gap-3 w-full">
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
            <button className="hover:bg-gray-100 p-2 rounded-md" onClick={() => setFilterModalOpen(true)}>
              <FaFilter className="w-5 h-5 text-gray-500"/>
            </button>
          </div>
        </div>
      </div>
      {/* <UserImageTable
        setDeleteModalOpen={setDeleteModalOpen}
        setDeleteFolderOpen={setDeleteFolderOpen}
        setRenameFolderModalOpen={setRenameFolderModalOpen}
        setRenameImageModalOpen={setRenameImageModalOpen}
        setFolderToAction={setFolderToAction}
        setImageToAction={setImageToAction}
        image={image}
        setImage={setImage}
        folder={folder}
        setFolder={setFolder}
        setpPremiumWarning={setpPremiumWarning}
      /> */}
    </div>
  );
}

export default AdminImagePage;
