import { Button, TextInput, Tooltip } from "flowbite-react";
import { FaFilter, FaInfoCircle, FaPlus, FaCheck } from "react-icons/fa";
import { HiExclamation } from "react-icons/hi";
import { PiStarFourFill } from "react-icons/pi";
import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ToastMsg from "../../Components/Other/ToastMsg";

import { inputTheme } from "../../Components/theme";
import AdminImageTable from "../../Components/Admin/training/AdminImageTable";
import AddToDatasetModal from "../../Components/Admin/training/AddToDatasetModal";

const ConditionalTooltip = ({ children, showTooltip, tooltipContent }) => {
  return showTooltip ? (
    <Tooltip content={tooltipContent} placement="bottom" trigger="hover" animation="duration-300">
      {children}
    </Tooltip>
  ) : (
    <>{children}</>
  );
};

function AdminImagePage() {
  const [image, setImage] = useState([]); // Images in the search
  const [imageToAction, setImageToAction] = useState(null); // Images to view, edit, delete, etc
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [addDatasetModalOpen, setAddDatasetModalOpen] = useState(false);

  // Toast Message
  const [successAddToast, setSuccessAddToast] = useState(false);
  const [partialSuccessAddToast, setPartialSuccessAddToast] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchValue = searchParams.get("search") || "";

  const [inputValue, setInputValue] = useState(searchValue);

  const isAnyChecked = useMemo(() => {
    return image.some(img => img.checked);
  }, [image]);

  return (
    <div className="px-5 mt-24 flex flex-col gap-5">
      <ToastMsg color="green" icon={<FaCheck className="h-5 w-5" />} open={successAddToast} setOpen={setSuccessAddToast} message="Images successfully added to dataset" />
      <ToastMsg color="red" icon={<HiExclamation className="h-5 w-5" />} open={partialSuccessAddToast} setOpen={setPartialSuccessAddToast} message="Some Images are duplicated (will not add)" />
      <AddToDatasetModal setPartialSuccessAddToast={setPartialSuccessAddToast} setSuccessAddToast={setSuccessAddToast} image={image} open={addDatasetModalOpen} setOpen={setAddDatasetModalOpen} />
      <h2 className="font-bold text-2xl">Uploaded Images</h2>
      <div className="flex flex-wrap flex-row justify-between gap-3 w-full">
        <div className="flex flex-row items-center gap-4">
          <TextInput
            className="w-96"
            placeholder="Inteligence Search"
            icon={PiStarFourFill}
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
            <Tooltip placement="bottom" content=" 
            Describe the features you're looking for, such as Color, Shape, environment, altitude">
              <button className="hover:bg-gray-100 p-2 rounded-md">
                <FaInfoCircle className="w-5 h-5 text-gray-500" />
              </button>
            </Tooltip>
            <button className="hover:bg-gray-100 p-2 rounded-md" onClick={() => setFilterModalOpen(true)}>
              <FaFilter className="w-5 h-5 text-gray-500"/>
            </button>
          </div>
        </div>
        <ConditionalTooltip
        showTooltip={!isAnyChecked}
        tooltipContent="Select at least one image"
      >
        <div className="inline-block">
          <Button 
            className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-700 items-center flex mb-4"
            disabled={!isAnyChecked}
            onClick={() => {setAddDatasetModalOpen(true)}}
          >
            <span className="flex items-center mr-2">
              <FaPlus />
            </span>
            <span>Add to Dataset</span>
          </Button>
        </div>
      </ConditionalTooltip>
      </div>
    <AdminImageTable
    image={image}
    setImage={setImage} />
    </div>
  );
}

export default AdminImagePage;