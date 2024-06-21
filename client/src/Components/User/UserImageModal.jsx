import {
  Label,
  Spinner,
  Button,
  Avatar,
  Textarea,
  ToggleSwitch,
  Tooltip,
  Drawer,
} from "flowbite-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { spinnerTheme, textAreaTheme, toggleSwitchTheme } from "../theme";
import { HiMenuAlt1 } from "react-icons/hi";
import { MdClose } from "react-icons/md";
import {
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa6";
import { IoMdArrowRoundBack, IoMdArrowRoundForward } from "react-icons/io";

export function SideBarContent({
  img,
  showConfidence,
  setShowConfidence,
  showBox,
  setShowBox,
  boundingBoxColor,
  setBoundingBoxColor,
  downloadLoading,
  download,
  clickFeedback,
}) {
  return (
    <div className="md:pt-24 p-2 md:p-5 flex flex-col justify-between md:h-full">
      <div>
        <h2 className="text-xl font-bold mb-4">Prediction Results</h2>
        <div className="flex flex-col gap-1.5 flex-wrap mr-2">
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
                {new Date(img?.upload_date).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }) || "N/A"}
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
        <div className="mt-3 flex flex-row gap-1 items-center w-full">
          {img?.feedback === null ? (
            <>
              <Tooltip content="Good Prediction">
                <button
                  className="rounded rounded-lg p-2 hover:bg-gray-100"
                  onClick={() => {
                    clickFeedback(true);
                  }}
                >
                  <FaRegThumbsUp className="text-gray-500 w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Bad Prediction">
                <button
                  className="rounded rounded-lg p-2 hover:bg-gray-100"
                  onClick={() => {
                    clickFeedback(false);
                  }}
                >
                  <FaRegThumbsDown className="text-gray-500 w-4 h-4" />
                </button>
              </Tooltip>
            </>
          ) : img?.feedback ? (
            <>
              <Tooltip content="Good Prediction">
                <button className="rounded rounded-lg p-2 hover:bg-gray-100">
                  <FaThumbsUp className="text-gray-500 w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Bad Prediction">
                <button
                  className="rounded rounded-lg p-2 hover:bg-gray-100"
                  onClick={() => {
                    clickFeedback(false);
                  }}
                >
                  <FaRegThumbsDown className="text-gray-500 w-4 h-4" />
                </button>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip content="Good Prediction">
                <button
                  className="rounded rounded-lg p-2 hover:bg-gray-100"
                  onClick={() => {
                    clickFeedback(true);
                  }}
                >
                  <FaRegThumbsUp className="text-gray-500 w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Bad Prediction">
                <button className="rounded rounded-lg p-2 hover:bg-gray-100">
                  <FaThumbsDown className="text-gray-500 w-4 h-4" />
                </button>
              </Tooltip>
            </>
          )}
        </div>

        <hr className="h-px mt-3 mb-6 bg-gray-200 border-0" />
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Image Description</h2>
          <Textarea
            rows={4}
            theme={textAreaTheme}
            placeholder={`${img?.description ? "" : "No description here."}`}
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
        disabled={downloadLoading}
        onClick={download}
        className={`mt-8 md:mt-4 bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
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
  );
}

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

  const [sideBarOpen, setSideBarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const imgRef = useRef(null);
  const download = async () => {
    setDownloadLoading(true);
    const url = folderId
      ? `/api/service/download-image?img_name=${imageName}&folder_id=${folderId}&draw_boxes=${showBox}&box_color=${encodeURIComponent(
          boundingBoxColor
        )}&show_confidence=${showConfidence}`
      : `/api/service/download-image?img_name=${imageName}&draw_boxes=${showBox}&box_color=${encodeURIComponent(
          boundingBoxColor
        )}&show_confidence=${showConfidence}`;
    try {
      const response = await axios.get(url, { responseType: "blob" });
      if (response.headers["content-type"] === "application/json") {
        const jsonResponse = JSON.parse(await response.data.text());
        const imageResponse = await fetch(jsonResponse.url);
        const imageBlob = await imageResponse.blob();
        const url = window.URL.createObjectURL(imageBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", imageName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${imageName}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error("Error downloading image:", error);
    }
    setDownloadLoading(false);
  };

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
  }, [imageName, navigate]);

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

  const clickFeedback = (feedback) => {
    axios
      .patch("/api/service/give-feedback", {
        name: imageName,
        good: feedback,
        folder_id: folderId ?? undefined,
      })
      .then((res) => {
        if (res.status === 200) {
          setImg((prevImg) => ({
            ...prevImg,
            feedback: feedback,
          }));
        }
      })
      .catch((err) => {
        if (err.response.status === 401) {
          navigate("/login");
        }
      });
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
          <button
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => {
              if (window.innerWidth < 768) {
                setDrawerOpen(true);
              } else {
                setSideBarOpen(!sideBarOpen);
              }
            }}
          >
            <HiMenuAlt1 className="w-6 h-6 text-gray-900" />
          </button>
          <Avatar size="xs" img={img?.thumbnail_url} />
          <Label className="truncate w-24 md:w-52">{imageName}</Label>
        </div>
        <div className="bg-gray-100 py-2 px-4 rounded-md flex flex-row justify-between w-40 items-center">
          <button
            disabled={index === 0}
            className={`p-1.5 rounded-md ${
              index === 0 ? "cursor-not-allowed" : "hover:bg-gray-200"
            }`}
            onClick={() => {
              if (!folderId) {
                navigate(
                  `/user/images/root/${encodeURIComponent(
                    imageList[index - 1].name
                  )}`
                );
              } else {
                navigate(
                  `/user/images/${folderId}/${encodeURIComponent(
                    imageList[index - 1].name
                  )}`
                );
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
                navigate(
                  `/user/images/root/${encodeURIComponent(
                    imageList[index + 1].name
                  )}`
                );
              } else {
                navigate(
                  `/user/images/${folderId}/${encodeURIComponent(
                    imageList[index + 1].name
                  )}`
                );
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
        {sideBarOpen && (
          <div className="hidden md:block w-[20rem] bg-white border-r-2 overflow-y-auto">
            <SideBarContent
              img={img}
              showConfidence={showConfidence}
              setShowConfidence={setShowConfidence}
              showBox={showBox}
              setShowBox={setShowBox}
              boundingBoxColor={boundingBoxColor}
              setBoundingBoxColor={setBoundingBoxColor}
              downloadLoading={downloadLoading}
              download={download}
              clickFeedback={clickFeedback}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex justify-center items-center py-28 px-6 md:px-24">
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
        <div className="md:hidden">
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <Drawer.Header title="Prediction" />
            <SideBarContent
              img={img}
              showConfidence={showConfidence}
              setShowConfidence={setShowConfidence}
              showBox={showBox}
              setShowBox={setShowBox}
              boundingBoxColor={boundingBoxColor}
              setBoundingBoxColor={setBoundingBoxColor}
              downloadLoading={downloadLoading}
              download={download}
              clickFeedback={clickFeedback}
            />
          </Drawer>
        </div>
      </div>
    </div>
  );
}

export default UserImageModal;
