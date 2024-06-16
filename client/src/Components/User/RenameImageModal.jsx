import {
  Modal,
  TextInput,
  Button,
  Spinner,
} from "flowbite-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { inputTheme, spinnerTheme } from "../theme";

function RenameImageModal({
  state,
  setState,
  imageName,
  setImage
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [imgName, setImgName] = useState("");
  const { folderId } = useParams();

  useEffect(() => {
    if (imageName !== null){setImgName(imageName);}
  }, [imageName])

  function handleRenameImage() {
    setLoading(true);
    const payload = {
      name: imageName,
      new_name: imgName,
      ...(folderId && { folder_id: folderId }),
    };
    axios.patch("/api/service/rename-image", payload)
    .then((res) => {
      if (res.status === 200) {
        setState(false);
        setImage((prev) => {
          const old_value = prev.item.get(imageName);
          prev.item.delete(imageName);
          prev.item.set(imgName, old_value);
          return {item: prev.item}
        })
      }
    })
    .catch((err) => {
      if (err.response.status === 401) {
        navigate("/login")
      } else if (err.response.status === 400) {
        setNameError(err.response.data.detail);
      }
    })
    .finally(() => {setLoading(false)})
  }
  
  return (
      <Modal className="" show={state} onClose={() => {setState(false); setNameError("")}} size="md" popup>
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
          </section>
        </div>
      </Modal>
  );
}
export default RenameImageModal;
