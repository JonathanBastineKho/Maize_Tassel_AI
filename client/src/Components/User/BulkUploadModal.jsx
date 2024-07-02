import {
  Modal,
  Label,
  TextInput,
  Textarea,
  Button,
  Spinner,
  Progress,
} from "flowbite-react";
import { inputTheme, textAreaTheme } from "../../Components/theme";
import { useContext, useState, useRef, useEffect } from "react";
import { BsStars } from "react-icons/bs";
import { FaTrash, FaFolder } from "react-icons/fa";
import { spinnerTheme } from "../../Components/theme";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../Authentication/AuthContext";
import { StorageContext } from "../Navbar/StorageContext";

function BulkUploadModal({ setImage, open, setOpen, setFolder, setBulkUploadMsg }) {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const { setStorage, getStorage, storage } = useContext(StorageContext);
  const storageRef = useRef(storage);
  const { folderId } = useParams();
  const [files, setFiles] = useState({});
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    const validFiles = Array.from(droppedFiles).filter(
      (file) =>
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "application/zip"
    );

    if (validFiles.length > 0) {
      if (validFiles.length === 1 && Object.keys(files).length === 0){
        setName(validFiles[0].name);
      }
      const newFiles = { ...files };
      validFiles.forEach((file) => {
        if (!newFiles[file.name]) {
          newFiles[file.name] = file;
        }
      });
      setFiles(newFiles);
    }
  };

  const startPolling = () => {
    const interval = setInterval(async () => {
      const currentStorage = await getStorage();
      if (currentStorage === storageRef.current) {
        clearInterval(interval);
      } else {
        setStorage(currentStorage);
      }
    }, 5000);
  };

  const closeModal = () => {
    setLoading(false);setFiles({});
    setOpen(false);setName("");
    setNameError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (Object.keys(files).length === 0){
      return
    }
    setLoading(true);

    const formData = new FormData(e.target);
    if (folderId) {
      formData.append("folder_uuid", folderId);
    }
    const fileEntries = Object.entries(files);
    // Bulk upload
    if (fileEntries.length > 1 || fileEntries[0][1].type === "application/zip") {

      fileEntries.forEach(([_, file]) => {
        formData.append("files", file);
      });
      axios
        .post("/api/service/bulk-count", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        })
        .then((res) => {
          if (res.status === 200) {
            setFolder((prev) => [...prev, res.data.folder]);
            setBulkUploadMsg(true);
            startPolling();
            closeModal();
          }
        })
        .catch((err) => {
          if (err.response.status === 401) {
            setUser(null);
            navigate("/login")
          } else if (err.response.status === 400) {
            setNameError(err.response.data.detail);
          }
        })
        .then(()=> setLoading(false));
    } 
    // Single upload
    else {
      const [fileName, file] = fileEntries[0];
      formData.append("file", file);
      axios
      .post("/api/service/count", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      })
      .then((res) => {
        if (res.status === 200) {
          setImage((prev) => {
            prev.item.set(res.data.name, {
              size: res.data.size,
              status: "in_queue",
              upload_date: new Date(res.data.upload_date).toLocaleDateString(
                undefined,
                { month: "long", day: "numeric", year: "numeric" }
              ),
              thumbnail_url: res.data.thumbnail_url,
            });
            return { item: prev.item };
          });
          setStorage((prev) => setStorage(prev+1));
          closeModal();
        }
      })
      .catch((err) => {
        if (err.response.status === 409 || err.response.status === 400) {
          setNameError(err.response.data.detail);
        } else if (err.response.status === 401) {
          setUser(null);
          navigate("/login");
        }
      })
      .then(() => setLoading(false));
    }
  };

  const fileEntries = Object.entries(files);
  const isSingleFile = fileEntries.length === 0 || (fileEntries.length === 1 && fileEntries[0][1].type !== "application/zip");

  return (
    <Modal show={open} onClose={closeModal} size="xl">
      <Modal.Header>Upload Maize Image</Modal.Header>
      <Modal.Body>
        <form className="flex flex-col gap-2" onSubmit={handleUpload}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="name" value={isSingleFile ? "Image Name" : "Folder Name"} />
            </div>
            <TextInput
              theme={inputTheme}
              id="name"
              name="name"
              placeholder={isSingleFile ? "Image Name" : "Folder Name"}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              color={nameError === "" ? "gray" : "failure"}
              helperText={<span className="font-medium">{nameError}</span>}
              required
            />
          </div>
          {isSingleFile && (
             <div>
              <div className="mb-2 block">
                <Label htmlFor="description" value="Image description" />
              </div>
              <Textarea
                theme={textAreaTheme}
                id="description"
                name="description"
                className="mb-2"
                placeholder="Image description"
              />
           </div>
           )
          }
         
          <div className="flex flex-col gap-2">
            <Label htmlFor="imageFile" value="Image File" />
            <div className="flex w-full">
              {Object.keys(files).length > 0 ? (
                <div className="flex flex-col w-full">
                  <div className={`w-full flex flex-col gap-4 py-3 max-h-64 overflow-y-auto`}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(e);
                  }}
                  onDragOver={(e) => e.preventDefault()}>
                    {Object.entries(files).map(([fileName, file], index) => (
                      <div
                        key={index}
                        className="w-full flex flex-row gap-3 items-center"
                      >
                        {file.type === "application/zip" ? (
                          <FaFolder className="w-8 h-8 text-gray-500" />
                        ) : (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={fileName}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}

                        <div className="flex flex-col w-full gap-2">
                          <div className="flex flex-row justify-between items-center w-full">
                            <Label className="max-w-72 truncate">
                              {fileName}
                            </Label>
                            {!loading && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  const newFiles = { ...files };
                                  delete newFiles[fileName];
                                  setFiles(newFiles);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-md"
                              >
                                <FaTrash className="text-red-500" />
                              </button>
                            )}
                          </div>
                          {loading && (
                            <Progress
                              color="green"
                              size="sm"
                              progress={progress}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <label
                    htmlFor="addMoreFiles"
                    className="mt-1 mb-1.5 text-gray-500 text-sm hover:bg-gray-200 w-fit mx-auto p-1.5 px-6 rounded-md bg-gray-100 cursor-pointer"
                  >
                    + Add more
                    <input
                      id="addMoreFiles"
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/jpeg, image/png, application/zip"
                      onChange={(ev) => {
                        const selectedFiles = Array.from(ev.target.files);
                        const newFiles = { ...files };
                        selectedFiles.forEach((file) => {
                          if (!newFiles[file.name]) {
                            newFiles[file.name] = file;
                          }
                        });
                        setFiles(newFiles);
                      }}
                    />
                  </label>
                </div>
              ) : (
                <Label
                  htmlFor="file"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600 ${
                    files.length > 0 ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      aria-hidden="true"
                      className="w-10 h-10 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      ></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG or ZIP
                    </p>
                  </div>
                  <input
                    id="file"
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/jpeg, image/png, application/zip"
                    onChange={(ev) => {
                      const selectedFiles = Array.from(ev.target.files);
                      if (selectedFiles.length === 1 && Object.keys(files).length === 0){
                        setName(selectedFiles[0].name);
                      }
                      const newFiles = { ...files };
                      selectedFiles.forEach((file) => {
                        if (!newFiles[file.name]) {
                          newFiles[file.name] = file;
                        }
                      });
                      setFiles(newFiles);
                    }}
                  />
                </Label>
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className={`mt-2 bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-700 ${
              loading ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <Spinner
                  aria-label="Spinner button example"
                  size="sm"
                  theme={spinnerTheme}
                />
                <span className="pl-3">Loading...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <BsStars />
                <span className="pl-3">Count Tassel</span>
              </div>
            )}
          </Button>
        </form>
      </Modal.Body>
    </Modal>
  );
}

export default BulkUploadModal;
