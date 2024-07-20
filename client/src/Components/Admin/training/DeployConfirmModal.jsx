import { Modal, Button, Spinner } from "flowbite-react";
import { spinnerTheme } from "../../theme";
import { IoWarningOutline } from "react-icons/io5";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function DeployConfirmModal({ setModels, selectedRunId, open, setOpen }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleDeploy = () => {
    setLoading(true);
    const model_version = {
      version: selectedRunId,
    };
    axios
      .patch("/api/maintenance/deploy-model", model_version)
      .then((res) => {
        if (res.status === 200) {
          setOpen(false);
          setModels((prevModels) =>
            prevModels.map((model, idx) => ({
              ...model,
              deployed: idx === selectedRunId,
            }))
          );
        }
      })
      .catch((err) => {
        if (err.response.status === 401) {
            navigate("/login");
        }
      })
      .finally(() => {setLoading(false)});
  };

  return (
    <Modal size="lg" show={open}>
      <Modal.Body className="mt-10">
        <div className="text-center">
          <div className="mb-4 bg-red-200 rounded-full p-2.5 w-fit mx-auto">
            <IoWarningOutline className="mx-auto h-10 w-10 text-red-600" />
          </div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Are you sure to deploy Model {selectedRunId}?
          </h3>
          <h3 className=" mx-auto mb-5 text-md w-4/5 text-gray-500 font-normal">
            This will publish the model to all the workers
          </h3>
          <div className="flex flex-row justify-center gap-4 w-full">
            <Button
            onClick={handleDeploy}
              className="w-full bg-red-500 focus:ring-4 focus:ring-red-300 enabled:hover:bg-red-600"
              disabled={loading}
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
                "Yes I'm Sure"
              )}
            </Button>
            <Button
              onClick={() => setOpen(false)}
              className="w-full"
              color="gray"
            >
              No, cancel
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default DeployConfirmModal;
