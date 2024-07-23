import { format } from "date-fns";
import { Button, Label, Tooltip } from "flowbite-react";
import {
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa6";
import { IoCropOutline } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { PiRectangleDashedDuotone } from "react-icons/pi";


function ImageSideBarContent({ croppingMode, setCroppingMode, newBoxToggle, setNewBoxToggle, selectedBox, setSelectedBox, label, setLabel, img }) {
    return (
        <div className="md:pt-24 p-2 md:p-5 flex flex-col h-full md:h-screen relative">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-4">Image Data</h2>
            {/* Image details */}
            <div className="flex flex-col gap-1.5 flex-wrap mr-2">
              <div className="flex flex-row flex-wrap justify-between">
                <Label className="text-gray-600">Number of Tassels:</Label>
                <div className="w-28">
                  <Label>{label?.length || 0}</Label>
                </div>
              </div>
              <div className="flex flex-row flex-wrap justify-between">
                <Label className="text-gray-600">Upload Date:</Label>
                <div className="w-28">
                  <Label>{img !== null && format(img?.upload_date, "MMMM dd, yyyy")}</Label>
                </div>
              </div>
              {/* Feedback and crop */}
              <div className="flex flex-row justify-between items-center">
                <div className="mt-3 flex flex-row gap-1 items-center w-full">
                  {img?.feedback === null ? (
                    <>
                      <Tooltip content="Good Prediction">
                        <div className="rounded rounded-lg p-2 hover:bg-gray-100">
                          <FaRegThumbsUp className="text-gray-500 w-4 h-4" />
                        </div>
                      </Tooltip>
                      <Tooltip content="Bad Prediction">
                        <div className="rounded rounded-lg p-2 hover:bg-gray-100">
                          <FaRegThumbsDown className="text-gray-500 w-4 h-4" />
                        </div>
                      </Tooltip>
                    </>
                  ) : img?.feedback ? (
                    <>
                      <Tooltip content="Good Prediction">
                        <div className="rounded rounded-lg p-2 hover:bg-gray-100">
                          <FaThumbsUp className="text-gray-500 w-4 h-4" />
                        </div>
                      </Tooltip>
                      <Tooltip content="Bad Prediction">
                        <div className="rounded rounded-lg p-2 hover:bg-gray-100">
                          <FaRegThumbsDown className="text-gray-500 w-4 h-4" />
                        </div>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip content="Good Prediction">
                        <div className="rounded rounded-lg p-2 hover:bg-gray-100">
                          <FaRegThumbsUp className="text-gray-500 w-4 h-4" />
                        </div>
                      </Tooltip>
                      <Tooltip content="Bad Prediction">
                        <div className="rounded rounded-lg p-2 hover:bg-gray-100">
                          <FaThumbsDown className="text-gray-500 w-4 h-4" />
                        </div>
                      </Tooltip>
                    </>
                  )}
                </div>
                <div className="flex flex-row items-center justify-between gap-1">
                <Tooltip content="Crop Image">
                  <button 
                  onClick={() => {setNewBoxToggle(false); setCroppingMode(!croppingMode);}}
                  className={`p-2 rounded rounded-lg ${croppingMode ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                    <IoCropOutline className="w-5 h-5 text-gray-500" />
                  </button>
                </Tooltip>
                <Tooltip content="New Box">
                  <button
                    onClick={() => {setCroppingMode(false); setNewBoxToggle(!newBoxToggle)}} 
                    className={`p-2 rounded rounded-lg ${newBoxToggle ? 'bg-gray-200' : 'hover:bg-gray-100 ' }`}>
                    <PiRectangleDashedDuotone className="w-5 h-5 text-gray-500" />
                  </button>
                </Tooltip>
                </div>
              </div>
            </div>
            <hr className="h-px mt-3 mb-6 bg-gray-200 border-0" />
          </div>
    
          {/* Label Box */}
          <div className="flex-grow flex flex-col overflow-hidden">
            <h2 className="text-xl font-bold mb-4">Label Box</h2>
            <div className="flex-grow overflow-y-auto pr-2">
              <div className="flex flex-col gap-2">
                {label?.map((box, idx) => (
                  <div className="rounded rounded-lg p-1 hover:bg-gray-100 flex flex-row items-center justify-between" key={idx}>
                    <div className="flex flex-row items-center gap-3">
                      <div className={`rounded rounded-full w-3 h-3 ${selectedBox === idx ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      <Label className="text-gray-600">Box {idx+1}</Label>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                      <Label className="text-gray-500">({Math.round(box.xCenter)}, {Math.round(box.yCenter)})</Label>
                      <button className="hover:bg-gray-200 rounded rounded-md p-1">
                        <IoMdClose className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
    
          <div className="mt-4">
            <Button className="w-full bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800">
              Save Changes
            </Button>
          </div>
        </div>
      );
}

export default ImageSideBarContent;
