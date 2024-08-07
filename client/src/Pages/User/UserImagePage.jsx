import { Button, TextInput } from "flowbite-react";
import { HiSearch, HiExclamation } from "react-icons/hi";
import { FaTrashAlt, FaFilter, FaFolderPlus, FaCheck, FaPlus } from "react-icons/fa";
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
import DeleteMultipleModal from "../../Components/User/DeleteMultipleModal"; // Import the new modal

function UserImagePage() {
  const { user } = useContext(AuthContext);
  const { storage } = useContext(StorageContext);

  const [uploadModalOpen, setUploadModalOpen] = useState(false); // Upload modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Delete modal image
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false); // Delete folder modal 
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderModalOpen, setRenameFolderModalOpen] = useState(false); // Rename folder modal
  const [renameImageModalOpen, setRenameImageModalOpen] = useState(false); // Rename image modal
  const [deleteMultipleModalOpen, setDeleteMultipleModalOpen] = useState(false); // Delete multiple modal

  const [folder, setFolder] = useState([]); // Folder in the search
  const [image, setImage] = useState({ item: new Map() }); // Images in the search
  const [imageToAction, setImageToAction] = useState(null); // Images to view, edit, delete, etc
  const [folderToAction, setFolderToAction] = useState(null); // Folder to edit, delete, etc
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [selectedItems, setSelectedItems] = useState([]); // State to manage selected items

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

  const openFolderModal = () => {
    if (user.role === "premium"){
      setCreateFolderOpen(true);
    } else {
      setpPremiumWarning(true);
    }
  }

  const handleDeleteClick = () => {
    if (selectedItems.length > 0) {
      setDeleteMultipleModalOpen(true);
    } else {
    }
  };

  return (
    <div className="px-5 mt-24 flex flex-col gap-5">
      <ToastMsg color="red" icon={<HiExclamation className="h-5 w-5" />} open={premiumWarning} setOpen={setpPremiumWarning} message="Premium feature only" />
      <ToastMsg color="red" icon={<HiExclamation className="h-5 w-5" />} open={fullStorage} setOpen={setFullStorage} message="Your storage is full" />
      <ToastMsg color="green" icon={<FaCheck className="h-5 w-5" />} open={bulkUploadMsg} setOpen={setBulkUploadMsg} message="Your images will be uploaded progressively" />
      <UserNewFolderModal updateUI={setFolder} state={createFolderOpen} setState={setCreateFolderOpen} />
      <DeleteImageModal
        setImageList={setImage}
        setImageToDelete={setImageToAction}
        imageToDelete={imageToAction}
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
      />
      <DeleteFolderModal
      open={deleteFolderOpen}
      setOpen={setDeleteFolderOpen}
      setFolderList={setFolder}
      folderToDelete={folderToAction}
      setFolderToDelete={setFolderToAction} />
      <DeleteMultipleModal
        state={deleteMultipleModalOpen}
        setState={setDeleteMultipleModalOpen}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        setFolderList={setFolder}
        setImage={setImage}
      />
      {user.role === "regular" ? (
      <UploadModal
        className="w-screen h-screen"
        setImage={setImage}
        open={uploadModalOpen}
        setOpen={setUploadModalOpen}
        setFullStorage={setFullStorage}
      />
    ) : (
      <BulkUploadModal 
      className="w-screen h-screen"
      setImage={setImage}
      setFolder={setFolder}
      open={uploadModalOpen}
      setOpen={setUploadModalOpen}
      setBulkUploadMsg={setBulkUploadMsg} />
    )}
      <RenameFolderModal
        state={renameFolderModalOpen}
        setState={setRenameFolderModalOpen}
        folderToAction={folderToAction}
        folder={folder}
        setFolder={setFolder}
      />
      <RenameImageModal
        state={renameImageModalOpen}
        setState={setRenameImageModalOpen}
        imageName={imageToAction}
        setImage={setImage}
      />
      <BreadcrumbFolder />
      <FilterModal
        className="w-screen h-screen"
        open={filterModalOpen}
        setOpen={setFilterModalOpen}
      />
      <h2 className="font-bold text-2xl">Your Images</h2>
      <div className="flex flex-wrap flex-row justify-between gap-3 w-full">
        <div className="flex flex-row items-center gap-4 md:w-fit w-full">
          <TextInput
            className="w-full md:w-96"
            placeholder="Search your image"
            icon={HiSearch}
            theme={inputTheme}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <div className="flex flex-row gap-1">
            <button className="hover:bg-gray-100 p-2 rounded-md" onClick={handleDeleteClick}>
              <FaTrashAlt className="w-5 h-5 text-gray-500" />
            </button>
            <button className="hover:bg-gray-100 p-2 rounded-md" onClick={() => setFilterModalOpen(true)}>
              <FaFilter className="w-5 h-5 text-gray-500"/>
            </button>
          </div>
        </div>
        <div className="flex flex-row gap-3">
          <Button
            onClick={() => {
              if (user.role === "regular" && storage >= 100) {
                setFullStorage(true);
              } else {
                setUploadModalOpen(true);
              }
            }}
            className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-700 items-center flex"
          >
            <span className="flex items-center mr-2">
              <FaPlus />
            </span>
            <span>Upload</span>
          </Button>
          <Button className="focus:ring-4 focus:ring-green-300" color="light" onClick={openFolderModal}>
            <span className="flex items-center mr-2">
              <FaFolderPlus className="text-gray-500 w-4 h-4" />
            </span>
            <span>Create Folder</span>
          </Button>
        </div>
      </div>
      <UserImageTable
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
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
      />
    </div>
  );
}

export default UserImagePage;
