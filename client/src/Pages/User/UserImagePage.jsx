import { Breadcrumb, Button, TextInput } from "flowbite-react";
import { HiHome, HiSearch } from "react-icons/hi";
import { FaTrashAlt, FaFilter, FaFolderPlus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { useState } from "react";

import { inputTheme } from "../../Components/theme";
import UserImageTable from "../../Components/User/UserImageTable";
import UploadModal from "../../Components/User/UserUploadModal";

function UserImagePage() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <>
    <UploadModal className="w-screen h-screen" open={uploadModalOpen} setOpen={setUploadModalOpen} />
    <div className="ml-[16.3rem] px-5 mt-24 flex flex-col gap-6 w-screen">
      <Breadcrumb aria-label="Default breadcrumb example">
        <Breadcrumb.Item href="#" icon={HiHome}>
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item href="#">Section 1</Breadcrumb.Item>
        <Breadcrumb.Item>Patch 2</Breadcrumb.Item>
      </Breadcrumb>
      <h2 className="font-bold text-2xl">Your Images</h2>
      <div className="flex flex-wrap flex-row justify-between">
        <div className="flex flex-row items-center gap-4">
          <TextInput
            className="w-96"
            placeholder="Search your image"
            icon={HiSearch}
            theme={inputTheme}
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
          <Button onClick={() => setUploadModalOpen(true)} className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-700 items-center flex">
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
      <UserImageTable />
    </div>
    </>
    
  );
}

export default UserImagePage;
