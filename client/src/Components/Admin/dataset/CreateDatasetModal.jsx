import { Modal, TextInput, Spinner, Button } from "flowbite-react";
import { useCallback, useState } from "react";
import { inputTheme, spinnerTheme } from "../../theme";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateDatasetModal({setDatasets, open, setOpen}) {
    const navigate = useNavigate();
    const [datasetName, setDatasetName] = useState("");
    const [loading, setLoading] = useState(false);
    const [nameError, setNameError] = useState("");

    const validateDatasetName = (name) => {
        const regex = /^[a-zA-Z0-9]+$/; // Only allow alphanumeric characters
        if (name.trim() === "") {
          setNameError("Dataset name cannot be empty");
          return false;
        }
        if (!regex.test(name)) {
          setNameError("Dataset name can only contain letters and numbers");
          return false;
        }
        setNameError("");
        return true;
      };

    const handleCreateDataset = useCallback(() => {
        if (!validateDatasetName(datasetName)) {
            return;
        }
        setLoading(true);
        axios.post("/api/maintenance/create-dataset",
            {
                name: datasetName
            }
        )
        .then((res) => {
            if (res.status === 200){
                setDatasetName("");
                setNameError("");
                setDatasets((prev) => [...prev, res.data.dataset])
                setOpen(false);
            }
        })
        .catch((err) => {
            if (err.response.status === 400) {
                setNameError(err.response.data.detail);
            } else if (err.response.status === 401) {
                navigate("/login");
            }
        })
        .finally(() => {setLoading(false)})
    })

    return (
        <Modal size="md" show={open}>
            <Modal.Body>
                <h2 className="text-2xl font-semibold mb-5">New Dataset</h2>
                <TextInput
                theme={inputTheme}
                color={nameError === "" ? "gray" : "failure"}
                helperText={<span className="font-medium">{nameError}</span>} 
                placeholder="Dataset Name"
                value={datasetName}
                onChange={(e) => {
                    setDatasetName(e.target.value);
                }}
                />
            <div className="flex flex-row items-center justify-between gap-3 mt-4">
            <Button
              onClick={() => {setOpen(false); setDatasetName(""); setNameError("")}}
              disabled={loading}
              className="w-full focus:ring-4 focus:ring-green-300"
              color="light"
            >
              Cancel
            </Button>
            <Button
            onClick={handleCreateDataset}
              disabled={loading}
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
            </div>
            </Modal.Body>
        </Modal>
    );
}

export default CreateDatasetModal;