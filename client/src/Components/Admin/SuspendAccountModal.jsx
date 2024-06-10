import {
  Button,
  Modal,
  Label,
  Dropdown,
  Select,
  Textarea,
  Spinner,
} from "flowbite-react";
import { useState } from "react";
import { IoTimerOutline } from "react-icons/io5";
import axios from "axios";
import { FaChevronDown } from "react-icons/fa";
import { textAreaTheme, spinnerTheme } from "../theme";
import { useNavigate } from "react-router-dom";

function SuspendAccountModal({ state, setState, userToSuspend, setUserList, setSuccessSuspend }) {
  const [durationUnit, setDurationUnit] = useState("Days");
  const navigate = useNavigate();
  const [suspendLoading, setSuspendLoading] = useState(false);

  const handleSuspendButton = (e) => {
    setSuspendLoading(true)
    e.preventDefault();
    const formData = new FormData(e.target.closest("form"));
    const category = formData.get("category");
    const detail = formData.get("detail");
    let duration = parseInt(formData.get("duration"));

    if (durationUnit === "Weeks") {
      duration *= 7;
    } else if (durationUnit === "Months") {
      duration *= 30;
    }

    axios
      .post("/api/user/suspend-account", {
        email: userToSuspend.email,
        category: category,
        reason: detail,
        duration: duration,
      })
      .then((res) => {
        if (res.status === 200){
          setState(false);
          setUserList((prevList) => {
            const updatedList = [...prevList];
            updatedList[userToSuspend.idx] = {
              ...updatedList[userToSuspend.idx],
              suspended: true,
            };
            return updatedList;
          });
          setDurationUnit("Days");
          setSuccessSuspend(true);
        }
      })
      .catch((error) => {
        if (error.response.status === 401) {
          navigate("/login");
        }
      })
      .finally(()=>{setSuspendLoading(false)});
  };

  return (
    <>
      <Modal
        className=""
        show={state}
        onClose={() => {
          setState(false);
        }}
        size="lg"
      >
        <Modal.Header>
          <div className="flex flex-col">
            <span>Suspend Account</span>
            <span className="text-gray-500 text-sm font-normal">
              {userToSuspend.email}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSuspendButton}>
            <div className="flex flex-col gap-4">
              <section>
                <div className="mb-2 block">
                  <Label htmlFor="category" value="Category" />
                </div>
                <Select id="category" name="category">
                  <option>Violations of Terms and Conditions</option>
                  <option>Copyright Infringement</option>
                  <option>Abuse of Service</option>
                  <option>Security Violations</option>
                </Select>
              </section>
              <section>
                <div className="mb-2 block">
                  <Label htmlFor="reason" value="Reason" />
                </div>
                <Textarea
                  theme={textAreaTheme}
                  id="details"
                  name="detail"
                  placeholder="Reason for suspension"
                  required
                  rows={4}
                />
              </section>
              <section className="flex flex-col justify-between ">
                <div className="mb-2 block">
                  <Label htmlFor="duration" value="Duration" />
                </div>
                <div className="flex flex-row ">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none">
                      <IoTimerOutline className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                      type="number"
                      min={1}
                      className="block p-2.5 w-full z-20 ps-10 text-sm text-gray-900 bg-gray-50 rounded-s-lg border-e-gray-50 border-e-2 border border-gray-300 focus:ring-green-500 focus:border-green-500"
                      defaultValue={1}
                      name="duration"
                    />
                  </div>
                  <Dropdown
                    label={durationUnit}
                    renderTrigger={() => (
                      <button className="w-56 text-sm font-medium text-center text-gray-900 bg-gray-100 rounded-l-none border border-gray-300 rounded-e-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 flex items-center justify-between px-3 py-2">
                        {durationUnit}
                        <FaChevronDown className="h-3 w-3 mt-1 text-gray-500" />
                      </button>
                    )}
                  >
                    <Dropdown.Item onClick={() => setDurationUnit("Days")}>
                      Days
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setDurationUnit("Weeks")}>
                      Weeks
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setDurationUnit("Months")}>
                      Months
                    </Dropdown.Item>
                  </Dropdown>
                </div>
              </section>
              <section className="flex flex-col justify-center gap-4 mt-2">
                <Button
                  type="submit"
                  disabled={suspendLoading}
                  className={`bg-red-500 focus:ring-4 focus:ring-red-300 enabled:hover:bg-red-600`}
                  onClick={handleSuspendButton}
                >
                  {suspendLoading ? (
                    <div className="flex items-center">
                      <Spinner
                        aria-label="Spinner button example"
                        size="sm"
                        theme={spinnerTheme}
                      />
                      <span className="pl-3">Loading...</span>
                    </div>
                  ) : (
                    "Suspend"
                  )}
                </Button>
              </section>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
}
export default SuspendAccountModal;
