import { Button, TextInput } from "flowbite-react";
import { HiSearch } from "react-icons/hi";
import { FaTrashAlt, FaFilter } from "react-icons/fa";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { inputTheme } from "../../Components/theme";
import AdminImageTable from "../../Components/Admin/training/AdminImageTable";

function AdminImagePage() {
  const [image, setImage] = useState([]); // Images in the search
  const [imageToAction, setImageToAction] = useState(null); // Images to view, edit, delete, etc
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchValue = searchParams.get("search") || "";

  const [inputValue, setInputValue] = useState(searchValue);

  return (
    <div className="px-5 mt-24 flex flex-col gap-5">
      <h2 className="font-bold text-2xl">Uploaded Images</h2>
      <div className="flex flex-wrap flex-row justify-between gap-3 w-full">
        <div className="flex flex-row items-center gap-4">
          <TextInput
            className="w-96"
            placeholder="Inteligence Search"
            icon={HiSearch}
            theme={inputTheme}
            value={inputValue}
            onChange={(e) => {setInputValue(e.target.value)}}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (inputValue === ''){
                  navigate('/admin/images');
                } else {
                  navigate(`/admin/images?search=${encodeURIComponent(inputValue)}`);
                }
              }
            }}
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
    <AdminImageTable
    image={image}
    setImage={setImage} />
    </div>
  );
}

export default AdminImagePage;
