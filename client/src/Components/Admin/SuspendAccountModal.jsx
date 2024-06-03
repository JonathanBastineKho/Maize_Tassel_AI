import { Button, Modal, Label, Dropdown } from "flowbite-react";
import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../Authentication/AuthContext";
import { FaChevronDown } from "react-icons/fa";

function SuspendAccountModal({ state, setState, email }) {
  const [durationUnit, setDurationUnit] = useState("Days");
  const [category, setCategory] = useState(
    "Violations of Terms and Conditions"
  );
  const [detail, setDetail] = useState("");
  const [duration, setDuration] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const { token } = useContext(AuthContext);

  const handleCloseModal = () => {
    setState(false);
  };

  const handleSuspendButton = () => {
    if (detail.length === 0 || duration === 0 || category.length === 0) {
      setValidationError(true);
      return;
    } else {
      setValidationError(false);
      let final_duration = duration;
      if (durationUnit === "Days") {
        final_duration = duration;
      } else if (durationUnit === "Weeks") {
        final_duration = duration * 7;
      } else {
        final_duration = duration * 30;
      }

      axios
        .post("/api/user/suspend-account", {
          email: email,
          category: category,
          reason: detail,
          duration: final_duration,
        })
        .then((response) => {
          console.log(response.data);
          setTimeout(() => {
            handleCloseModal();
          }, 2500);

          setValidationError(null);
          setCategory("Violations of Terms and Conditions");
          setDetail("");
          setDuration(null);
          setDurationUnit("Days");
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  return (
    <>
      <Modal
        className=""
        show={state}
        onClose={handleCloseModal}
        size="md"
        popup
      >
        {/* <Card className=" "> */}
        <Modal.Header className="h-12">
          <div className="flex flex-col">
            <h5
              className="text-lg  text-gray-900 dark:text-white justify-center mt-3 ml-10  flex font-bold"
              contentEditable={false}
            >
              Suspend Account : <br />
            </h5>
            <h5 className="text-sm ml-10 mb-2 mt-1 text-gray-700">{email}</h5>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="flex flex-col items-center mt-10">
            <div className="flex flex-col gap-y-3">
              <section className="flex flex-col w-80 ">
                <Label htmlFor="category" value="Category" />
                <Dropdown
                  size=""
                  color="white"
                  className="border border-black "
                  label={"asd"}
                  renderTrigger={() => (
                    <Button
                      size="xs"
                      color="white"
                      className="border border-gray-300 bg-white "
                    >
                      <span className="text-sm">{category}</span>
                      <FaChevronDown className="absolute right-2  h-3 w-3 mt-1" />
                    </Button>
                  )}
                >
                  <Dropdown.Item
                    onClick={() =>
                      setCategory("Violations of Terms and Conditions")
                    }
                  >
                    Violations of Terms and Conditions:
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => setCategory("Copyright Infringement")}
                  >
                    Copyright Infringement
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => setCategory("Abuse of Service")}
                  >
                    Abuse of Service
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setCategory("Weeks")}>
                    Security Violations
                  </Dropdown.Item>
                </Dropdown>
              </section>
              <section className="flex flex-col w-80 ">
                <Label htmlFor="details" value="Details" />
                <textarea
                  className="resize-none border border-gray-300 h-28 rounded-lg "
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                />
              </section>
              <section className="flex flex-col justify-between ">
                <Label htmlFor="duration" value="Duration" />
                <div className="flex flex-row ">
                  <input
                    type="number"
                    className="border rounded-lg rounded-r-none border-gray-300 w-20 "
                    min={1}
                    value={duration}
                    onChange={(event) =>
                      setDuration(event.target.valueAsNumber)
                    }
                  />
                  <Dropdown
                    size=""
                    className=""
                    label={durationUnit}
                    renderTrigger={() => (
                      <Button
                        color="blue"
                        className="w-60 border-gray-300 text-black bg-white rounded-lg rounded-l-none enabled:hover:bg-gray-100 "
                      >
                        {durationUnit}
                        <FaChevronDown className="absolute right-2  h-3 w-3 mt-1" />
                      </Button>
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
              <section style={{ height: "20px" }}>
                {validationError === true ? (
                  <Label className="text-red-500">Please fill all fields</Label>
                ) : validationError === false ? (
                  <Label className="text-green-500">
                    User Successfully Suspended
                  </Label>
                ) : null}
              </section>
              <section className="flex flex-col justify-center gap-4 mt-2">
                <Button
                  color=""
                  className="w-full border border-black bg-red-500 text-white hover:bg-red-600"
                  onClick={handleSuspendButton}
                >
                  Suspend
                </Button>
              </section>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
export default SuspendAccountModal;
