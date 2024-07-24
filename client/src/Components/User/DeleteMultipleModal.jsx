import { Modal, Button, Spinner } from "flowbite-react";
import { useContext, useState } from "react";
import { IoWarningOutline } from "react-icons/io5";
import axios from "axios";
import { spinnerTheme } from "../theme";
import { useNavigate } from "react-router-dom";

function DeleteMultipleModal({
  setFolderList,
  setImage,
  selectedItems,
  setSelectedItems,
  state,
  setState,
}) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const confirm = () => {
    setLoading(true);
    const deleteRequests = [];

    selectedItems.forEach((item) => {
      if (item.type === "image") {
        deleteRequests.push(
          axios.delete("/api/service/delete-image", {
            data: { name: item.id, folder_id: item.folder_id },
          })
        );
      } else if (item.type === "folder") {
        deleteRequests.push(
          axios.delete("/api/service/delete-folder", {
            data: { folder_id: item.id },
          })
        );
      }
    });

    Promise.all(deleteRequests)
      .then(async (responses) => {
        responses.forEach((res, idx) => {
          if (res.status === 200) {
            const item = selectedItems[idx];
            if (item.type === "image") {
              setImage((prevImages) => {
                prevImages.item.delete(item.id);
                return { item: prevImages.item };
              });
            } else if (item.type === "folder") {
              setFolderList((prevFolders) =>
                prevFolders.filter((folder) => folder.id !== item.id)
              );
            }
          }
        });

        setState(false);
        setSelectedItems([]);
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Modal
      show={state}
      size="md"
      onClose={() => {
        setState(false);
      }}
      popup
    >
      <Modal.Body className="mt-10">
        <div className="text-center">
          <div className="mb-4 bg-red-200 rounded-full p-2.5 w-fit mx-auto">
            <IoWarningOutline className="mx-auto h-10 w-10 text-red-600" />
          </div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Are you sure to delete the selected items?
          </h3>
          <h3 className=" mx-auto mb-5 text-md w-4/5 text-gray-500 font-normal">
            This action cannot be undone. All images and folders selected will be lost.
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
                setState(false);
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

export default DeleteMultipleModal;


