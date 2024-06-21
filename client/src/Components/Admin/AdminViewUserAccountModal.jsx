// Dependencies
import { Modal, Card, Label, Table, Spinner, Button, Badge } from "flowbite-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { spinnerTheme } from "../theme";

// Local Imports
import { format } from "date-fns";

function AdminViewUserAccountModal({ state, setState, userToView, setCancelSubAccountModalOpen, setSuspendAccountModalOpen }) {
  const [account, setAccount] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    if (state) {
      axios
        .get(`/api/user/view-account?email=${userToView.email}`)
        .then((res) => {
          setAccount(res.data);
        })
        .catch((err) => {
          if (err.response.status === 401) {
            navigate("/login");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [state]);

  return (
    <>
      <Modal show={state} onClose={() => setState(false)} size="6xl" popup>
        <Modal.Header />
        {loading ? (
          <div className="mt-8 flex items-center justify-center">
            <Spinner theme={spinnerTheme} />
          </div>
        ) : (
          <Modal.Body>
            <div className="flex md:flex-row flex-col gap-5 pb-5 mx-2">
                <Card className="md:w-4/12 sm:w-full">
                  <div className="flex flex-col">
                    <div className="flex flex-col items-center gap-y-2 border-b pb-3 border-gray mb-3">
                      {/* Profile Picture, Name, and Email */}
                      <img
                        className="w-20 h-20 rounded-full"
                        alt="profile_picture"
                        referrerPolicy="no-referrer"
                        src={`${account.user.profile_pict}?${Date.now()}`}
                      />
                      <section className="text-center flex flex-col  mt-1">
                        <h1 className="text-md font-semi">
                          {account.user.name}
                        </h1>
                        <h1 className="text-sm text-gray-600">
                          {account.user.email}
                        </h1>
                      </section>
                    </div>
                    <div className="w-fit my-1 flex flex-row gap-2">
                      {account.user.verified ? (<Badge color="gray">Verified</Badge>) : (<Badge color="warning">Unverified</Badge>)}
                      {account.user.role === "regular" ? (<Badge color="gray">Regular</Badge>) : (<Badge color="success">Premium</Badge>)}
                      {account.suspended && <Badge color="failure">Suspended</Badge>}
                    </div>
                    <div className="flex flex-col gap-y-3 mt-4 ml-2">
                      {/* More Information */}
                      <div className="flex flex-col">
                        <Label className="text-xs">Phone Num :</Label>
                        <h1>{account.user.phone || "Not Available"}</h1>
                      </div>
                      <div className="flex flex-col">
                        <Label className="text-xs">Country :</Label>
                        <h1>{account.user.country || "Not Available"}</h1>
                      </div>
                      <div className="flex flex-col">
                        <Label className="text-xs">Subscription : </Label>
                        <div className="flex flex-row items-end">
                          {account.user.role === "regular" ? (
                            <h1 className="No Subscription">
                              No Active Subscription
                            </h1>
                          ) : (
                            <h1 className="Active Subscription">
                              {account.cancelled ? (
                                <span>
                                  Subscription will end on{" "}
                                  {format(
                                    new Date(account.next_date),
                                    "MMMM d, yyyy"
                                  )}
                                </span>
                              ) : (
                                <span>
                                  Next payment on{" "}
                                  {format(
                                    new Date(account.next_date),
                                    "MMMM d, yyyy"
                                  )}
                                </span>
                              )}
                            </h1>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              <div className="flex-1 flex flex-col">
                <h1 className="font-bold mb-5 ml-2 text-lg">
                  Suspension History
                </h1>
                <div className="flex flex-col justify-between h-full">
                  <div className="overflow-auto">
                    <Table className="w-full max-h-64" striped>
                      <Table.Head>
                        <Table.HeadCell>Date Range</Table.HeadCell>
                        <Table.HeadCell>Category</Table.HeadCell>
                        <Table.HeadCell>Reason</Table.HeadCell>
                      </Table.Head>
                      <Table.Body>
                        {account.suspension.length === 0 ? (
                          <Table.Row>
                            <Table.Cell colSpan={4} className="text-center">
                              No Suspension History
                            </Table.Cell>
                          </Table.Row>
                        ) : (
                          account.suspension.map((suspension, index) => (
                            <Table.Row
                              key={index}
                            >
                              <Table.Cell className="text-gray-700">
                                {format(new Date(suspension.start_date), "MMMM d, yyyy")} - {format(new Date(suspension.end_date), "MMMM d, yyyy")}
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
                  <div className="gap-5 grid md:grid-cols-2 sm:grid-cols-1">
                    <Button 
                    onClick={()=>{setSuspendAccountModalOpen(true); setState(false);}}
                    disabled={account.suspended} className="bg-red-500 focus:ring-4 focus:ring-red-300 enabled:hover:bg-red-600">Suspend User</Button>
                    <Button
                    onClick={() => {setCancelSubAccountModalOpen(true); setState(false)}}
                    disabled={account.user.role === "regular" || account.cancelled} className="bg-gray-500 focus:ring-4 focus:ring-gray-300 enabled:hover:bg-gray-600">Cancel Subscription</Button>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
        )}
      </Modal>
    </>
  );
}

export default AdminViewUserAccountModal;
