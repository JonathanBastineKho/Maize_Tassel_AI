import { useRef } from "react";
import { Dropdown } from "flowbite-react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdCloudDownload } from "react-icons/md";
import { RiPencilFill } from "react-icons/ri";
import { FaTrashCan } from "react-icons/fa6";

import React from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const ThreeDotsVerticalIcon = React.forwardRef((props, ref) => (
  <div ref={ref} {...props}>
    <BsThreeDotsVertical />
  </div>
));

function ActionButton({ setDeleteModalOpen, setImageToAction, imgName, setRenameImageModalOpen }) {
  const dropdownRef = useRef(null);
  const { folderId } = useParams();

  const handleDropdownClick = (event) => {
    if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
      event.stopPropagation();
    }
  };

  const downloadImage = async () => {
    const url = folderId ? `/api/service/download-image?img_name=${imgName}&folder_id=${folderId}&draw_boxes=${true}&box_color=${encodeURIComponent("#f43f5e")}&show_confidence=${false}` :
    `/api/service/download-image?img_name=${imgName}&draw_boxes=${true}&box_color=${encodeURIComponent("#f43f5e")}&show_confidence=${false}`;
    try {
      const response = await axios.get(url, {responseType: 'blob'});
      if (response.headers['content-type'] === 'application/json') {
        const jsonResponse = JSON.parse(await response.data.text());
        const imageResponse = await fetch(jsonResponse.url);
        const imageBlob = await imageResponse.blob();
        const url = window.URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', imgName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${imgName}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  }
  
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
          <Dropdown.Item onClick={() => {downloadImage()}}>
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