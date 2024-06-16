import { useRef } from "react";
import { Dropdown } from "flowbite-react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdCloudDownload } from "react-icons/md";
import { RiPencilFill } from "react-icons/ri";
import { FaTrashCan } from "react-icons/fa6";

import React from "react";

const ThreeDotsVerticalIcon = React.forwardRef((props, ref) => (
  <div ref={ref} {...props}>
    <BsThreeDotsVertical />
  </div>
));

function ActionButton({ setDeleteModalOpen, setImageToAction, imgName, setRenameImageModalOpen }) {
  const dropdownRef = useRef(null);

  const handleDropdownClick = (event) => {
    if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
      event.stopPropagation();
    }
  };
  
  return (
    <div ref={dropdownRef} onClick={handleDropdownClick} className="relative">
      <Dropdown
        renderTrigger={() => <div className="w-fit p-2 rounded-md hover:bg-gray-100"><ThreeDotsVerticalIcon /></div>}
        arrowIcon={false}
        placement="bottom-end"
        className="absolute right-0"
      >
        <div className="min-w-36">
          <Dropdown.Item onClick={() => {setRenameImageModalOpen(true); setImageToAction(imgName)}}>
            <div className="flex flex-row items-center gap-3">
              <RiPencilFill className="text-gray-500 w-5 h-5" />
              Edit
            </div>
          </Dropdown.Item>
          <Dropdown.Item>
            <div className="flex flex-row items-center gap-3">
              <MdCloudDownload className="text-gray-500 w-5 h-5" />
              Download
            </div>
          </Dropdown.Item>
          <Dropdown.Item onClick={()=>{setImageToAction(imgName); setDeleteModalOpen(true);}}>
            <div className="flex flex-row items-center gap-3">
              <FaTrashCan className="text-gray-500 w-5 h-5" />
              Delete
            </div>
          </Dropdown.Item>
        </div>
      </Dropdown>
    </div>
  );
}

export default ActionButton;