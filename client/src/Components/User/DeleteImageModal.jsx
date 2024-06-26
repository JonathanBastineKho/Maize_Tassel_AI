import { Modal, Button, Spinner } from "flowbite-react";
import { useContext, useState } from "react";
import { IoWarningOutline } from "react-icons/io5";
import axios from "axios";
import { useParams } from "react-router-dom";
import { spinnerTheme } from "../theme";
import { StorageContext } from "../Navbar/StorageContext";

function DeleteImageModal({
  setImageList,
  setImageToDelete,
  imageToDelete,
  open,
  setOpen,
}) {
  const { folderId } = useParams();
  const { setStorage } = useContext(StorageContext);
  const [loading, setLoading] = useState(false);
  const deleteImage = () => {
    setLoading(true);

    axios
      .delete("/api/service/delete-image", {
        data: {
          name: imageToDelete,
          ...(folderId && { folder_id: folderId }),
        },
      })
      .then(() => {
        setOpen(false);
        setImageList((prevImageList) => {
          prevImageList.item.delete(imageToDelete)
          return {item : prevImageList.item}
        });
        setStorage((prev)=>(prev-1));
        setImageToDelete(null);
      })
      .catch((error) => console.error("Error deleting image:", error))
      .finally(() => setLoading(false));
  };

  return (
    <Modal
      show={open}
      size="md"
      onClose={() => {
        setImageToDelete(null);
        setOpen(false);
      }}
      popup
    >
      <Modal.Body className="mt-10">
        <div className="text-center">
          <div className="mb-4 bg-red-200 rounded-full p-2.5 w-fit mx-auto">
            <IoWarningOutline className="mx-auto h-10 w-10 text-red-600" />
          </div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Are you sure to delete this image?
          </h3>
          <h3 className=" mx-auto mb-5 text-md w-4/5 text-gray-500 font-normal">
            This action cannot be undone. All data associated with this images
            will be lost.
          </h3>
          <div className="flex flex-col justify-center gap-4">
            <Button color="failure" onClick={deleteImage} disabled={loading}>
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
                "Yes I'm Sure"
              )}
            </Button>
            <Button
              color="gray"
              onClick={() => {
                setImageToDelete(null);
                setOpen(false);
              }}
            >
              No, cancel
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default DeleteImageModal;
