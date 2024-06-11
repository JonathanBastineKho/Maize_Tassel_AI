import { Table, Spinner, Avatar, Label } from "flowbite-react";
import { tableTheme } from "../theme";
import { useEffect, useState } from "react";
import axios from "axios";
import { spinnerTheme } from "../theme";
import { useNavigate, useLocation } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import SuspendAccountModal from "./SuspendAccountModal";
import UserActionButton from "./UserActionButton";

function AdminUsersTable({
  userToAction, 
  setUserToAction,
  setViewAccountModalOpen,
  setCancelSubAccountModalOpen, 
  setSuspendAccountModalOpen,
  suspendAccountModalOpen,
  setSuccessSuspend
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const search = searchParams.get("search") || "";

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = () => {
    axios
      .get(`/api/user/search-user?page=${page}&page_size=20&search=${search || ""}`)
      .then((res) => {
        if (res.status === 200) {
          if (page === 1) {
            setUsers(res.data.users);
          } else {
            setUsers((prevUsers) => [...prevUsers, ...res.data.users]);
          }
          setPage((prevPage) => prevPage + 1);
          setHasMore(res.data.users.length === 20);
        }
      })
      .catch((err) => {
        if (err.response.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page === 1) {
      fetchUsers();
    }
  }, [page, search]);

  return (
    <>
      <SuspendAccountModal
        state={suspendAccountModalOpen}
        setState={setSuspendAccountModalOpen}
        userToSuspend={userToAction}
        setUserList={setUsers}
        setSuccessSuspend={setSuccessSuspend}
      />
      {loading ? (
        <div className="mt-8 flex items-center justify-center">
          <Spinner className="" theme={spinnerTheme} />
        </div>
      ) : (
        <Table theme={tableTheme} hoverable striped>
          <Table.Head>
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell>Subscription</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
            <Table.HeadCell>Country</Table.HeadCell>
            <Table.HeadCell>
              <span className="sr-only">Edit</span>
            </Table.HeadCell>
          </Table.Head>
          {users.length === 0 ? (
            <Table.Body>
              <Table.Row>
                <Table.Cell colSpan="5">
                  <div className="mt-8 flex items-center justify-center">
                    <Label className="text-gray-500">No user exists</Label>
                  </div>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          ) : (
            <InfiniteScroll
              dataLength={users.length}
              next={fetchUsers}
              hasMore={hasMore}
              scrollThreshold={0.8}
              style={{ overflow: 'visible' }}
              loader={
                <Table.Body>
                  <Table.Row>
                    <Table.Cell colSpan="5">
                      <div className="mt-8 flex items-center justify-center">
                        <Label className="text-gray-500">Loading...</Label>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              }
            >
              <Table.Body>
                {users.map((user, idx) => (
                  <Table.Row 
                    key={idx} 
                    className="cursor-pointer" 
                    onClick={() => {
                      setUserToAction({ name: user.name, email: user.email, idx: idx });
                      setViewAccountModalOpen(true);
                    }}
                  >
                    <Table.Cell>
                      <div className="flex flex-row gap-8">
                        <Avatar
                          alt="User settings"
                          img={(avatarProps) => (
                            <img
                              {...avatarProps}
                              referrerPolicy="no-referrer"
                              src={`${user.profile_pict}?${Date.now()}`}
                              alt={avatarProps.alt}
                            />
                          )}
                          rounded
                        />
                        <div className="flex flex-col">
                          <Label>{user.name}</Label>
                          <Label className="text-gray-500">{user.email}</Label>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {user.role[0].toUpperCase() + user.role.slice(1)}
                    </Table.Cell>
                    <Table.Cell>
                      {user.suspended ? (
                        <div className="flex flex-row gap-2 items-center">
                          <div className="rounded-full bg-red-500 w-2.5 h-2.5"></div>
                          <Label className="text-gray-500">Suspended</Label>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2 items-center">
                          <div className="rounded-full bg-green-400 w-2.5 h-2.5"></div>
                          <Label className="text-gray-500">Active</Label>
                        </div>
                      )}
                    </Table.Cell>
                    <Table.Cell>{user.country ? user.country : "-"}</Table.Cell>
                    <Table.Cell>
                      <UserActionButton 
                        user={{ name: user.name, email: user.email, idx: idx }}
                        setUserToAction={setUserToAction}
                        setSuspendModalOpen={setSuspendAccountModalOpen}
                        setCancelModalOpen={setCancelSubAccountModalOpen} 
                      />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </InfiniteScroll>
          )}
        </Table>
      )}
    </>
  );
}

export default AdminUsersTable;

