import {
  Modal,
  TextInput,
  Button,
  Spinner,
  Label,
  Textarea,
} from "flowbite-react";
import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { inputTheme, spinnerTheme, textAreaTheme } from "../theme";
import { set } from "date-fns";

function RenameImageModal({
  state,
  setState,
  imageName,
  imageDescription,
  folderId,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [imgName, setImgName] = useState(null);
  

  useEffect(() => {
    setImgName(imageName);
  }, [imageName]);

  function handleRenameImage() {
    console.log(imageName);
    console.log(imgName);
    console.log(`folderId: ${folderId}`)

    if (folderId === undefined) {
      console.log("folderId is undefined")
      axios.put(`/api/service/rename-image`, {
        image_name : imageName, 
        new_name : imgName,
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
    } else {
      console.log("folderId is defined")
      axios.put(`/api/service/rename-image`, {
        image_name : imageName,
        folder_id : folderId,
        new_name : imgName
      })
      .then((res) => {
        if (res.status === 200) {
          setState(false);
        }
      })
      .catch((err) => {
        console.log(err);
      })
    }

  }
  
  return (
    <>
      <Modal className="" show={state} onClose={() => setState(false)} size="md" popup>
        <div className="p-8">
          <div className="flex flex-col gap-y-3 mb-6">
            <div className="">
              <h2 className="text-2xl font-semibold mb-6">Rename Image</h2>
              <TextInput
                theme={inputTheme}
                id="name"
                name="name"
                placeholder="Your image name"
                value={imgName}
                onChange={(e) => {
                  setImgName(e.target.value);
                }}
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
              onClick={
                () => {
                  if (imgName === "") {
                    setNameError("Name cannot be empty");
                  } 
                  else if (imgName === imageName) {
                    setNameError("Name cannot be the same as the current name")
                  }
                  else {
                    handleRenameImage();
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
            {/* {error && <p style={{ color: 'red' }}>{error}</p>} */}
          </section>
        </div>
      </Modal>
    </>
  );
}
export default RenameImageModal;
