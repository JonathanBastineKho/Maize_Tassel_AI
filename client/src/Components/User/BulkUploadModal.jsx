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
  import { useContext, useState } from "react";
  import { BsStars } from "react-icons/bs";
  import { FaTrash } from "react-icons/fa";
  import { spinnerTheme } from "../../Components/theme";
  import axios from "axios";
  import { useNavigate, useParams } from "react-router-dom";
  import { AuthContext } from "../Authentication/AuthContext";
  
  function BulkUploadModal({ setImage, open, setOpen }) {
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);
    const { folderId } = useParams();
    const [file, setFile] = useState(null);
    const [name, setName] = useState("");
    const [nameError, setNameError] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
  
    const handleDrop = (e) => {
      e.preventDefault();
      const droppedFiles = e.dataTransfer.files;
      const validFiles = Array.from(droppedFiles).filter(
        (file) => file.type === "image/jpeg" || file.type === "image/png"
      );
  
      if (validFiles.length > 0) {
        setFile(validFiles[0]);
        setName(validFiles[0].name);
      } else {
        console.log("Invalid file type. Only JPG and PNG files are allowed.");
      }
    };
  
    const closeModal = () => {
          setLoading(false);
          setFile(null);
          setOpen(false);
          setName("");
          setNameError('');
    }
  
    const handleUpload = async (e) => {
      e.preventDefault();
      setLoading(true);
  
      const formData = new FormData(e.target);
      formData.append("file", file);
      if (folderId){
        formData.append("folder_uuid", folderId);
      }
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
                upload_date : new Date(res.data.upload_date).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'}),
                thumbnail_url : res.data.thumbnail_url
              })
              return {item: prev.item}
            })
            closeModal();
          }
        })
        .catch((err) => {
          if (err.response.status === 409) {
              setNameError(err.response.data.detail);
          } else if (err.response.status === 401) {
              setUser(null);
              navigate('/login')
          }
        })
        .then(() => setLoading(false));
    };
  
    return (
      <Modal
        show={open}
        onClose={closeModal}
        size="lg"
      >
        <Modal.Header>Upload Maize Image</Modal.Header>
        <Modal.Body>
          <form className="flex flex-col gap-2" onSubmit={handleUpload}>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="name" value="Image Name" />
              </div>
              <TextInput
                theme={inputTheme}
                id="name"
                name="name"
                placeholder="Your image name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                color={nameError === '' ? "gray" : "failure"}
                helperText={<span className="font-medium">{nameError}</span>}
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="description" value="Image Description" />
              </div>
              <Textarea
                theme={textAreaTheme}
                id="description"
                name="description"
                className="mb-2"
                placeholder="Image Description"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="imageFile" value="Image File" />
              <div className="flex w-full">
                {file ? (
                  <div className="w-full flex flex-row py-3">
                      <div className="w-full flex flex-row gap-3 items-center">
                          <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-11 h-11 object-cover rounded"
                          />
                          <div className="flex flex-col w-full gap-2">
                              <div className="flex flex-row justify-between items-center w-full">
                                  <Label>{file.name}</Label>
                                  {!loading &&
                                      <button
                                      onClick={() => setFile(null)}
                                      className="p-2 hover:bg-gray-100 rounded-md"
                                      >
                                      <FaTrash className="text-red-500" />
                                      </button>
                                  }
                              </div>
                              {loading && <Progress color="green" size="sm" progress={progress} />}
                          </div>
                      </div>
                  </div>
                ) : (
                  <Label
                    htmlFor="file"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={`flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600 ${
                      file ? "opacity-50" : ""
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
                        SVG, PNG, JPG or GIF (MAX. 800x400px)
                      </p>
                    </div>
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      accept="image/jpeg, image/png"
                      onChange={(ev) => {
                        setFile(ev.target.files[0]);
                        setName(ev.target.files[0].name);
                      }}
                    />
                  </Label>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className={`bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-700 ${
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
  