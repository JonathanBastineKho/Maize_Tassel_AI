import {
  Label,
  Spinner,
  Button,
  Avatar,
  Textarea,
  ToggleSwitch,
} from "flowbite-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { spinnerTheme, textAreaTheme, toggleSwitchTheme } from "../theme";
import { HiMenuAlt1 } from "react-icons/hi";
import { MdClose } from "react-icons/md";
import { IoMdArrowRoundBack, IoMdArrowRoundForward } from "react-icons/io";

function UserImageModal({ index, setIndex, imageList }) {
  const { folderId, imageName } = useParams();
  const navigate = useNavigate();
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [showBox, setShowBox] = useState(true);
  const [showConfidence, setShowConfidence] = useState(false);
  const [boundingBoxColor, setBoundingBoxColor] = useState("#f43f5e");
  const imgRef = useRef(null);
  useEffect(() => {
    if (imageName) {
      setLoading(true);
      const url = folderId
        ? `/api/service/view-image?img_name=${imageName}&folder_id=${folderId}`
        : `/api/service/view-image?img_name=${imageName}`;

      axios
        .get(url)
        .then((res) => {
          setImg(res.data);
        })
        .catch((err) => {
          if (err.response.status === 401) {
            navigate("/login");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [imageName]);

  useEffect(() => {
    const updateImgSize = () => {
      if (imgRef.current) {
        setImgSize({
          width: imgRef.current.width,
          height: imgRef.current.height,
        });
      }
    };

    updateImgSize();

    window.addEventListener("resize", updateImgSize);
    return () => {
      window.removeEventListener("resize", updateImgSize);
    };
  }, []);

  const handleImageLoad = (e) => {
    setImgSize({ width: e.target.width, height: e.target.height });
  };

  return (
    <div
      className={`fixed z-50 inset-0 bg-black bg-opacity-40 backdrop-blur-md ${
        imageName !== undefined ? "block" : "hidden"
      }`}
    >
      {/* Top bar */}
      <div className="fixed bg-white top-0 left-0 w-screen py-3 px-4 border-b-2 z-20 flex items-center justify-between flex-wrap">
        <div className="flex flex-row gap-3 items-center">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <HiMenuAlt1 className="w-6 h-6 text-gray-900" />
          </button>
          <Avatar size="xs" img={img?.thumbnail_url} />
          <Label className="truncate w-60">{imageName}</Label>
        </div>
        <div className="bg-gray-100 py-2 px-4 rounded-md flex flex-row justify-between w-40 items-center">
          <button
            disabled={index === 0}
            className={`p-1.5 rounded-md ${
              index === 0 ? "cursor-not-allowed" : "hover:bg-gray-200"
            }`}
            onClick={() => {
              if (!folderId) {
                navigate(`/user/images/root/${imageList[index - 1][0]}`);
              } else {
                navigate(`/user/images/${folderId}/${imageList[index - 1][0]}`);
              }
              setIndex(index - 1);
            }}
          >
            <IoMdArrowRoundBack className="text-gray-600" />
          </button>
          <Label>
            {index + 1} / {imageList.length}
          </Label>
          <button
            disabled={imageList.length === index + 1}
            className={`p-1.5 rounded-md ${
              imageList.length === index + 1
                ? "cursor-not-allowed"
                : "hover:bg-gray-200"
            }`}
            onClick={() => {
              if (!folderId) {
                navigate(`/user/images/root/${imageList[index + 1][0]}`);
              } else {
                navigate(`/user/images/${folderId}/${imageList[index + 1][0]}`);
              }
              setIndex(index + 1);
            }}
          >
            <IoMdArrowRoundForward className="text-gray-600" />
          </button>
        </div>
        <button
          className="hover:bg-gray-200 p-2 rounded-md mr-2"
          onClick={() => {
            if (!folderId) {
              navigate("/user/images");
            } else {
              navigate(`/user/images/${folderId}`);
            }
          }}
        >
          <MdClose className="w-5 h-5" />
        </button>
      </div>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-[20rem] bg-white border-r-2">
          <div className="pt-24 p-5 flex flex-col justify-between h-full">
            <div>
              <h2 className="text-xl font-bold mb-4">Prediction Results</h2>
              <div className="flex flex-col gap-2 flex-wrap mr-2">
                <div className="flex flex-row flex-wrap justify-between">
                  <Label className="text-gray-600">Number of Tassels:</Label>
                  <div className="w-28">
                    <Label>{img?.prediction?.length || 0}</Label>
                  </div>
                </div>
                <div className="flex flex-row flex-wrap justify-between">
                  <Label className="text-gray-600">Processing time:</Label>
                  <div className="w-28">
                    <Label>{img?.processing_time || "N/A"}</Label>
                  </div>
                </div>
                <div className="flex flex-row flex-wrap justify-between">
                  <Label className="text-gray-600">Upload Date:</Label>
                  <div className="w-28">
                    <Label>
                      {new Date(img?.upload_date).toLocaleDateString(
                        undefined,
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      ) || "N/A"}
                    </Label>
                  </div>
                </div>
                <div className="flex flex-row flex-wrap justify-between">
                  <Label className="text-gray-600">Size:</Label>
                  <div className="w-28">
                    <Label>{img?.size || "N/A"} MB</Label>
                  </div>
                </div>
                <div className="flex flex-row flex-wrap justify-between">
                  <Label className="text-gray-600">Dimension:</Label>
                  <div className="w-28">
                    <Label>
                      {img?.width || "N/A"} x {img?.height || "N/A"}
                    </Label>
                  </div>
                </div>
              </div>
              <hr className="h-px my-8 bg-gray-200 border-0" />
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Image Description</h2>
                <Textarea
                  rows={4}
                  theme={textAreaTheme}
                  placeholder={`${
                    img?.description ? "" : "No description here."
                  }`}
                />
              </div>
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Image Settings</h2>
                <div className="flex flex-col gap-4 flex-wrap mr-2">
                  <div className="flex flex-row flex-wrap justify-between">
                    <Label className="text-gray-600">Show Confidence:</Label>
                    <ToggleSwitch
                      theme={toggleSwitchTheme}
                      color="green"
                      checked={showConfidence}
                      onChange={(checked) => {
                        if (!showBox) {
                          setShowBox(checked);
                        }
                        setShowConfidence(checked);
                      }}
                    />
                  </div>
                  <div className="flex flex-row flex-wrap justify-between">
                    <Label className="text-gray-600">Show Box:</Label>
                    <ToggleSwitch
                      theme={toggleSwitchTheme}
                      color="green"
                      checked={showBox}
                      onChange={(checked) => {
                        if (!checked && showConfidence) {
                          setShowConfidence(checked);
                        }
                        setShowBox(checked);
                      }}
                    />
                  </div>
                  <div className="flex flex-row flex-wrap justify-between">
                    <Label className="text-gray-600">Box color:</Label>
                    <input
                      value={boundingBoxColor}
                      className="rounded-lg"
                      type="color"
                      onChange={(e) => setBoundingBoxColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={downloadLoading}
              className={`bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
                downloadLoading ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {downloadLoading ? (
                <div className="flex items-center">
                  <Spinner
                    aria-label="Spinner button example"
                    size="sm"
                    theme={spinnerTheme}
                  />
                  <span className="pl-3">Loading...</span>
                </div>
              ) : (
                "Download Results"
              )}
            </Button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 flex justify-center items-center p-32">
          {loading ? (
            <div className="items-center mx-auto">
              <Spinner theme={spinnerTheme} />
            </div>
          ) : (
            <div className="relative h-full">
              <img
                src={img.url}
                alt="Image"
                ref={imgRef}
                className="max-h-full object-contain"
                onLoad={handleImageLoad}
              />
              {img.status === "done" && showBox
                ? img.prediction.map((prediction, key) => (
                    <div
                      key={key}
                      className={`absolute border-2`}
                      style={{
                        borderColor: boundingBoxColor,
                        left:
                          (prediction.xCenter - prediction.width / 2) *
                          (imgSize.width / img.width),
                        top:
                          (prediction.yCenter - prediction.height / 2) *
                          (imgSize.height / img.height),
                        width: prediction.width * (imgSize.width / img.width),
                        height:
                          prediction.height * (imgSize.height / img.height),
                      }}
                    >
                      {showConfidence && (
                        <div className="absolute top-0 left-0 p-1 text-xs text-white bg-black bg-opacity-50 rounded-br">
                          {(prediction.confidence * 100).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  ))
                : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserImageModal;
