import { BsThreeDotsVertical } from "react-icons/bs";
import { useRef, useState } from "react";
import { MdDelete, MdCloudDownload, MdModeEdit } from "react-icons/md";
import useOnClickOutside from "use-onclickoutside"

function ActionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
  
    const handleTriggerClick = (e) => {
    e.stopPropagation();
      setIsOpen(!isOpen);
    };
  
    useOnClickOutside(dropdownRef, () => setIsOpen(false));
  
    return (
      <div ref={dropdownRef} className="relative">
        <button
          className="hover:bg-gray-100 p-2 rounded-md"
          onClick={handleTriggerClick}
        >
          <BsThreeDotsVertical />
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10">
            <button
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <div className="flex flex-row gap-3 items-center">
                    <MdModeEdit className="w-5 h-5 text-gray-500" /> 
                    Edit
                </div>
            </button>
            <button
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <div className="flex flex-row gap-3 items-center">
                    <MdCloudDownload className="w-5 h-5 text-gray-500" /> 
                    Download
                </div>
            </button>
            <button
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
                <div className="flex flex-row gap-3 items-center">
                    <MdDelete className="w-5 h-5 text-gray-500" /> 
                    Delete
                </div>
            </button>
          </div>
        )}
      </div>
    );
  }
  
export default ActionButton;
