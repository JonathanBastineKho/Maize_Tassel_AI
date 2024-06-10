import { useRef } from "react";
import { Dropdown } from "flowbite-react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdCancel } from "react-icons/md";
import { TbHammer } from "react-icons/tb";


import React from "react";

const ThreeDotsVerticalIcon = React.forwardRef((props, ref) => (
  <div ref={ref} {...props}>
    <BsThreeDotsVertical />
  </div>
));

function UserActionButton({ user, setUserToAction, setSuspendModalOpen, setCancelModalOpen }) {
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
        <div className="min-w-48">
          <Dropdown.Item onClick={() => {setUserToAction(user); setSuspendModalOpen(true);}}>
            <div className="flex flex-row items-center gap-3">
              <TbHammer className="text-gray-500 w-5 h-5" />
              Suspend
            </div>
          </Dropdown.Item>
          <Dropdown.Item onClick={() => {setUserToAction(user); setCancelModalOpen(true)}}>
            <div className="flex flex-row items-center gap-3">
              <MdCancel className="text-gray-500 w-5 h-5" />
              Cancel Subsciption
            </div>
          </Dropdown.Item>
        </div>
      </Dropdown>
    </div>
  );
}

export default UserActionButton;