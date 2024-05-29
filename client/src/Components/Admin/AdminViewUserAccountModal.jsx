import {
  Button,
  Modal,
  Card,
  Label,
  Textarea,
  Checkbox,
  TextInput,
  Table,
} from "flowbite-react";

import {
  RenderRegularRoleTag,
  RenderPremiumRoleTag,
  RenderAdminRoleTag,
  RenderVerifiedRoleTag,
  RenderUnVerifiedRoleTag,
  RenderSuspendedText,
} from "../tags";

import { FaTimes, FaUser } from "react-icons/fa";
import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { tableTheme } from "../theme";
import { AuthContext } from "../Authentication/AuthContext";

function AdminViewUserAccountModal({ state, setState, email }) {
  const { token } = useContext(AuthContext);
  const [userAccount, setUserAccount] = useState({});
  const [userSuspension, setUserSuspension] = useState([]);
  const [userSubscription, setUserSubcription] = useState({});
  const [userTags, setUserTags] = useState(null);

  const handleUserTags = (account) => {
    // Check if user is verified
    console.log("handle user tags");
    console.log(userAccount);
    let tags = [];
    if (userAccount.verified === true) {
      tags.push(RenderVerifiedRoleTag());
    } else {
      tags.push(RenderUnVerifiedRoleTag());
    }

    // Check User Role
    if (userAccount.role === "regular") {
      tags.push(RenderRegularRoleTag());
    } else if (userAccount.role === "premium") {
      tags.push(RenderPremiumRoleTag());
    } else if (userAccount.role === "admin") {
      tags.push(RenderAdminRoleTag());
    }

    setUserTags(tags);
  };

  const handleSuspendButton = () => {
    console.log("Suspend Button Clicked");
  };

  useEffect(() => {
    axios
      .get(`/api/user/view-account/${email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUserAccount(res.data.user);
        console.log(res.data.user);
        handleUserTags(userAccount);
        setUserSuspension(res.data.suspension);
        console.log(res.data.suspension);
        setUserSubcription(res.data.transaction);
        console.log(res.data.transaction);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <>
      <Modal
        className=""
        show={state}
        onClose={() => setState(false)}
        size="6xl"
        popup
      >
        <Modal.Header />
        <Modal.Body>
          <div className="flex flex-row gap-x-5">
            <div className="w-5/12">
              <Card>
                <div className="flex flex-col">
                  <div className="flex flex-col items-center gap-y-2 border-b pb-3 border-gray mb-3">
                    {/* Profile Picture, Name, and Email */}
                    {/* <FaUser className="text-6xl text-gray-500" /> */}
                    <img
                      src={userAccount.profile_pict}
                      className="w-20 h-20 rounded-full"
                      alt="profile_picture"
                    />
                    <section className="text-center flex flex-col  mt-1">
                      <h1 className="text-md font-semi">{userAccount.name}</h1>
                      <h1 className="text-sm text-gray-600">
                        {userAccount.email}
                      </h1>
                    </section>
                  </div>
                  <div className="mt-2 ml-1">{userTags}</div>
                  <div className="flex flex-col gap-y-3 mt-4 ml-2">
                    {/* More Information */}

                    <div className="flex flex-col">
                      <Label className="text-xs">Phone Num :</Label>
                      <h1>{userAccount.phone || "Not Available"}</h1>
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-xs">Country :</Label>
                      <h1>{userAccount.country || "Not Available"}</h1>
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-xs">Subscription : </Label>
                      <div className="flex flex-row items-end">
                        {userSubscription.length === 0 ? (
                          <h1 className="No Subscription">No Subscription</h1>
                        ) : (
                          <h1 className="Active Subscription">
                            Active Subscription
                          </h1>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="w-7/12">
              <Card>
                <div className="flex flex-col">
                  <section>
                    <div className="flex flex-row justify-between items-end border-b border-gray-500">
                      <h1 className="font-bold pb-3 ml-2">
                        Suspension History
                      </h1>
                      <a
                        className="mb-3 pb3 border border-black font-semibold text-white rounded px-4 bg-red-700  hover:bg-red-800 hover:cursor-pointer"
                        onClick={handleSuspendButton}
                      >
                        Suspend User
                      </a>
                    </div>
                    <div
                      style={{
                        height: "304px",
                        width: "100%",
                        overflow: "auto",
                        overflowX: "hidden",
                      }}
                      className="flex flex-row mt-4 w-full"
                    >
                      <Table
                        className="bg-white ml-2 h-64 w-full table-fixed"
                        color="red"
                      >
                        <Table.Head>
                          <Table.HeadCell className="w-1/4 bg-green-200">
                            Start Date
                          </Table.HeadCell>
                          <Table.HeadCell className="w-1/4 bg-green-200">
                            End Date
                          </Table.HeadCell>
                          <Table.HeadCell className="w-1/4 bg-green-200">
                            Category
                          </Table.HeadCell>
                          <Table.HeadCell className="w-1/4 bg-green-200">
                            Reason
                          </Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                          {userSuspension.length === 0 ? (
                            <Table.Row>
                              <Table.Cell colSpan={4} className="text-center">
                                No Suspension History
                              </Table.Cell>
                            </Table.Row>
                          ) : (
                            userSuspension.map((suspension, index) => (
                              <Table.Row
                                key={index}
                                className={index % 2 === 0 ? "bg-gray-50" : ""}
                              >
                                <Table.Cell className="text-gray-700">
                                  {suspension.start_date}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700">
                                  {suspension.end_date}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700">
                                  {suspension.category}
                                </Table.Cell>
                                <Table.Cell className="text-gray-700">
                                  {suspension.reason}
                                </Table.Cell>
                              </Table.Row>
                            ))
                          )}
                        </Table.Body>
                      </Table>
                    </div>
                  </section>
                </div>
              </Card>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default AdminViewUserAccountModal;
