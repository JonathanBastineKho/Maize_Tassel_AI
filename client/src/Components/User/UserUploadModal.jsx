import {
  Modal,
  Label,
  TextInput,
  Textarea,
  Button,
} from "flowbite-react";
import { inputTheme, textAreaTheme } from "../../Components/theme";
import { useState } from "react";
import { BsStars } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";
import { spinnerTheme } from "../../Components/theme";

function UploadModal({ open, setOpen }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    const validFiles = Array.from(droppedFiles).filter(
      (file) => file.type === "image/jpeg" || file.type === "image/png"
    );

    if (validFiles.length > 0) {
      setFile(validFiles[0]);
    } else {
      console.log("Invalid file type. Only JPG and PNG files are allowed.");
    }
  };

  const handleRemove = () => {
    setFile(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
  }

  return (
    <Modal
      show={open}
      onClose={() => {
        setFile(null);
        setOpen(false);
      }}
      size="lg"
    >
      <Modal.Header>Upload Maize Image</Modal.Header>
      <Modal.Body>
        <form className="flex flex-col gap-4" onSubmit={handleUpload}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="imageName" value="Image Name" />
            </div>
            <TextInput
              theme={inputTheme}
              id="imageName"
              placeholder="Your image name"
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
              placeholder="Image Description"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="imageFile" value="Image File" />
            <div className="flex w-full">
              {file ? (
                <div className="w-full flex justify-between flex-row py-4">
                    <div className="flex flex-row gap-3 items-center">
                        <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-8 h-8 object-cover rounded"
                        />
                    <Label >{file.name}</Label>
                  </div>
                  <button onClick={handleRemove} className="p-2 hover:bg-gray-100 rounded-md">
                    <FaTrash className="text-red-500"/>
                  </button>
                </div>
              ) : (
                <Label
                  htmlFor="dropzone-file"
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
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/jpeg, image/png"
                    onChange={(ev) => setFile(ev.target.files[0])}
                  />
                </Label>
              )}
            </div>
          </div>
          <Button
          type="submit"
          disabled={loading}
          className={`bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-700 ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
          >
          {loading ? (
            <div className="flex items-center">
              <Spinner aria-label="Spinner button example" size="sm" theme={spinnerTheme} />
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

export default UploadModal;
