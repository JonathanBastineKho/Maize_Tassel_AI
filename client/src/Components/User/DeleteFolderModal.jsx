import { Modal, Button, Spinner } from "flowbite-react";
import { useContext, useState } from "react";
import { IoWarningOutline } from "react-icons/io5";
import axios from "axios";
import { spinnerTheme } from "../theme";
import { StorageContext } from "../Navbar/StorageContext";
import { useNavigate } from "react-router-dom";

function DeleteFolderModal({
  setFolderList,
  setFolderToDelete,
  folderToDelete,
  open,
  setOpen,
}) {
  const { setStorage, getStorage } = useContext(StorageContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const confirm = () => {
    setLoading(true);
    axios
        .delete("/api/service/delete-folder", {
            data: {
                folder_id: folderToDelete.id
            }
        })
        .then(async (res) => {
            if (res.status === 200){
                setOpen(false);
                setFolderList((prev) => {
                    const updated = [...prev];
                    updated.splice(folderToDelete.idx, 1);
                    return updated;
                });
            }
            const currentStorage = await getStorage();
            setStorage(currentStorage);
        })
        .catch((err) => {
            if (err.response.status === 401){
                navigate("/login");
            }
        })
        .finally(()=>{setLoading(false)});
  };

  return (
    <Modal
      show={open}
      size="md"
      onClose={() => {
        setFolderToDelete(null);
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
            Are you sure to delete this folder?
          </h3>
          <h3 className=" mx-auto mb-5 text-md w-4/5 text-gray-500 font-normal">
            This action cannot be undone. All images associated with this folder
            will be lost.
          </h3>
          <div className="flex flex-col justify-center gap-4">
            <Button color="failure" onClick={confirm} disabled={loading}>
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
                setFolderToDelete(null);
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

export default DeleteFolderModal;
