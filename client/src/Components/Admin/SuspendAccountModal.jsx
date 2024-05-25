import {
  Button,
  Modal,
  Card,
  Label,
  Dropdown,
  TextInput,
} from "flowbite-react";
import { useState, useRef, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../Authentication/AuthContext";
import Calendar from "react-calendar";
import { FaChevronDown } from "react-icons/fa";

function SuspendAccountModal({ state, setState, email, firstName, lastName }) {
  const [durationUnit, setDurationUnit] = useState("Days");
  const [category, setCategory] = useState("Violation of Terms and Conditions");
  const [detail, setDetail] = useState("");
  const [duration, setDuration] = useState(null);

  const { token } = useContext(AuthContext);

  const handleCloseModal = () => {
    setState(false);
    window.location.reload();
  };

  const handleSuspendButton = () => {

    let final_duration = duration;
    if (durationUnit === "Days") {
      final_duration = duration;
    } else if (durationUnit === "Weeks") {
      final_duration = duration * 7;
    } else {
      final_duration = duration * 30;
    }

    // console.log({
    //   email: email,
    //   category: category,
    //   detail: detail,
    //   duration: final_duration,
    // });

    axios
      .post("api/user/suspend-account", {
        email: email,
        category: category,
        detail: detail,
        duration: final_duration,
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <>
      <Modal
        className=""
        show={state}
        onClose={handleCloseModal}
        size="sm"
        popup
      >
        {/* <Card className=" "> */}
        <Modal.Header className="h-12 ">
          <h5
            className="text-lg  text-gray-900 dark:text-white justify-center mt-1 ml-2 flex font-bold"
            contentEditable={false}
          >
            Suspend {email}
          </h5>
        </Modal.Header>
        <Modal.Body>
          <div className="flex flex-col items-center mt-1">
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
