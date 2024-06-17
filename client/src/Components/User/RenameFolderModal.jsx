import { Modal, TextInput, Button, Spinner } from "flowbite-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { inputTheme, spinnerTheme } from "../theme";

function RenameFolderModal({ state, setState, folderToAction, folder, setFolder}) {
  const navigate = useNavigate();
  const [folderNameState, setFolderNameState] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (folderToAction !== null) {
      setFolderNameState(folder[folderToAction.idx]?.name);
    }
  }, [folder, folderToAction])

  function closeModal() {
    setState(false);
    setNameError("");
  }

  function handleRenameFolder() {
    setLoading(true);
    const payload = {
      folder_id: folderToAction.id,
      new_name: folderNameState
    }
    axios.patch("/api/service/rename-folder", payload)
    .then((res) => {
      if (res.status === 200) {
        setState(false);
        setFolder((prev) => {
          const newFolderState = [...prev];
          newFolderState[folderToAction.idx] = {
            ...newFolderState[folderToAction.idx],
            name: folderNameState,
          }
          return newFolderState;
        })
      }
    })
    .catch((err) => {
      if (err.response.status === 400) {
        setNameError(err.response.data.detail)
      } else if (err.response.status === 401) {
        navigate("/login");
      }
    })
    .finally(() => {setLoading(false)})
  }

  return (
    <>
      <Modal className="" show={state} onClose={closeModal} size="md" popup>
        <div className="p-8">
          <div className="flex flex-col gap-y-3 mb-6">
            <div className="">
          <h2 className="text-2xl font-semibold mb-6">Rename Folder</h2>
          <TextInput
            theme={inputTheme}
            id="name"
            name="name"
            placeholder="Your folder name"
            value = {folderNameState}
            onChange={(e) => (setFolderNameState(e.target.value))}
            color={nameError === "" ? "gray" : "failure"}
            helperText={<span className="font-medium">{nameError}</span>}
            required
          />
          </div>
          </div>
          <section className="flex flex-row justify-end gap-3">
            <Button
              onClick={() => {
                setState(false);
                setNameError("");
              }}
              disabled={loading}
              className="w-full focus:ring-4 focus:ring-green-300"
              color="light"
              
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={() => {
                if (folderNameState === "") {
                  setNameError("Folder name cannot be empty");
                }
                else {
                  handleRenameFolder();
                }
              }}
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
                "Confirm"
              )}
            </Button>
          </section>
        </div>
      </Modal>
    </>
  );
}
export default RenameFolderModal;
