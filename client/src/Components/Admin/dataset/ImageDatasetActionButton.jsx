import { useRef } from "react";
import { Dropdown } from "flowbite-react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";

import React from "react";

const ThreeDotsVerticalIcon = React.forwardRef((props, ref) => (
    <div ref={ref} {...props}>
      <BsThreeDotsVertical />
    </div>
  ));

function ImageDatasetActionButton({ deleteAction }) {
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
          <Dropdown.Item onClick={() => {
            deleteAction();
          }}>
            <div className="flex flex-row items-center gap-3">
              <FaTrash className="text-gray-500 w-5 h-5" />
              Remove
            </div>
          </Dropdown.Item>
        </div>
      </Dropdown>
    </div>
  );
}

export default ImageDatasetActionButton;