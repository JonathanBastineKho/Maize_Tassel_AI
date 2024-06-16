import {
  Modal,
  Label,
  TextInput,
  Button,
  Spinner,
} from "flowbite-react";

import { useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { inputTheme, spinnerTheme } from "../theme";

function UserNewFolderModal({ updateUI, state, setState }) {
  const folderNameRef = useRef();
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [loading, setLoading] = useState(false);

  function closeModal() {
    setState(false);
  }

  function handleCreateFolder() {
    setLoading(true);
    const folderName = folderNameRef.current.value;

    const payload = {
      folder_name: folderName,
      ...(folderId && { parent_id: folderId }),
    };
    axios
      .post("/api/service/create-folder", payload)
      .then((response) => {
        if (response.status === 200) {
          updateUI((prev) => [...prev, response.data.folder]);
          closeModal();
        }
      })
      .catch((error) => {
        if (error.response.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <>
      <Modal className="" show={state} onClose={closeModal} size="md" popup>
        <FaTimes
          className="text-gray-500 absolute top-0 right-0 m-2 rounded-md w-5 h-5 cursor-pointer"
          onClick={closeModal}
        />
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">New Folder</h2>
          <TextInput
            required
            className="mb-6"
            theme={inputTheme}
            placeholder="Enter folder name"
            ref={folderNameRef}
          />
          <section className="flex flex-row justify-end gap-3">
            <Button
              onClick={() => setState(false)}
              disabled={loading}
              className="w-full focus:ring-4 focus:ring-green-300"
              color="light"
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={handleCreateFolder}
              className={`w-full bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
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
                "Create"
              )}
            </Button>
          </section>
        </div>
      </Modal>
    </>
  );
}
export default UserNewFolderModal;
