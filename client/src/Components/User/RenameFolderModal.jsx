import { Modal, TextInput, Button, Spinner } from "flowbite-react";
import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { inputTheme, spinnerTheme } from "../theme";
import { set } from "date-fns";

function RenameFolderModal({ state, setState, folderName, folderId}) {
  const [folderNameState, setFolderNameState] = useState(null);
  const navigate = useNavigate();
  // const { folderId } = useParams();
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect ( () => { 
    setFolderNameState(folderName);
  }, [folderName])

  function closeModal() {
    setState(false);
  }

  function handleRenameFolder() {
    console.log(folderNameState);
    console.log(`folderId: ${folderId}`);
    axios.put(`/api/service/rename-folder`, {
      folder_id : folderId,
      folder_name : folderNameState
    })
    .then((res) => {
      setNameError("");
      if (res.status === 200) {
        setState(false);
      }
      window.location.reload();
    })
    .catch((err) => {
  
      console.log(err);
    })
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
            helperText={<span className="font-medium  ">{nameError}</span>}
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
                else if (folderNameState === folderName) {
                  setNameError("Folder name cannot be the same as the current name");
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
