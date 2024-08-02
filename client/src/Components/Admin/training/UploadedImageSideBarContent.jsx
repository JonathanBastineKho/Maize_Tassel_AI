import { format } from "date-fns";
import { Button, Label, Tooltip } from "flowbite-react";
import {
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa6";

function UploadedImageSideBarContent({ setAddDatasetModalOpen, img, prediction }) {
    return (
        <div className="md:pt-24 p-2 md:p-5 flex justify-between flex-col h-full md:h-screen relative">
            <div className="mb-4">
            <h2 className="text-xl font-bold mb-4">Image Data</h2>
            {/* Image details */}
            <div className="flex flex-col gap-1.5 flex-wrap mr-2">
              <div className="flex flex-row flex-wrap justify-between">
                <Label className="text-gray-600">Number of Tassels:</Label>
                <div className="w-28">
                  <Label>{prediction?.length || 0}</Label>
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
              </div>
            </div>
            <hr className="h-px mt-3 mb-6 bg-gray-200 border-0" />
          </div>
          <div className="mt-4">
                <Button
                onClick={() => {setAddDatasetModalOpen(true)}}
                className="w-full bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800">
                Add to Dataset
                </Button>
            </div>
        </div>
    );
}

export default UploadedImageSideBarContent;