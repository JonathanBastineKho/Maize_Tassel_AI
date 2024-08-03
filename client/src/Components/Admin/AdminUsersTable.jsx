import { Table, Spinner, Avatar, Label } from "flowbite-react";
import { tableTheme } from "../theme";
import { useEffect, useState } from "react";
import axios from "axios";
import { spinnerTheme } from "../theme";
import { useNavigate, useLocation } from "react-router-dom";
import InifiniteScroll from "react-infinite-scroll-component";
import SuspendAccountModal from "./SuspendAccountModal";
import UserActionButton from "./UserActionButton";

function AdminUsersTable({
  userToAction, 
  setUserToAction,
  setViewAccountModalOpen,
  setCancelSubAccountModalOpen, 
  setSuspendAccountModalOpen,
  suspendAccountModalOpen,
  setSuccessSuspend}) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const search = searchParams.get("search") || "";
  const premiumAccount = searchParams.get("premium_account")
  const suspension = searchParams.get("suspension")
  const googleAccount = searchParams.get("google_account")
  const country = searchParams.get("country")

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = () => {

    const params = {
      page,
      page_size: 20,
      search,
      ...(premiumAccount !== null && { premium_account: premiumAccount }),
      ...(suspension !== null && { suspension }),
      ...(googleAccount !== null && { google_account: googleAccount }),
      ...(country && { country }),
    };

    axios
      .get("/api/user/search-user", { params })
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
  }, [search, premiumAccount, suspension, googleAccount, country]);

  useEffect(() => {
    if (page === 1) {
      fetchUsers();
    }
  }, [page, search, premiumAccount, suspension, googleAccount, country]);

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
        <InifiniteScroll
              dataLength={users.length}
              next={fetchUsers}
              hasMore={hasMore}
              scrollThreshold={0.8}
              style={{ overflow: 'visible' }}
              loader={
                <div className="mt-8 flex items-center justify-center">
                  <Label className="text-gray-500">Loading...</Label>
                </div>
              }
            >
        <Table theme={tableTheme} hoverable striped>
          <Table.Head>
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell className="hidden md:table-cell">Subscription</Table.HeadCell>
            <Table.HeadCell className="hidden md:table-cell">Status</Table.HeadCell>
            <Table.HeadCell className="hidden md:table-cell">Country</Table.HeadCell>
            <Table.HeadCell>
              <span className="sr-only">Edit</span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {users.length === 0 && 
            <Table.Row>
              <Table.Cell colSpan={5} className="text-center">
                  <span className="text-gray-500 text-center">No users available</span>
              </Table.Cell>
            </Table.Row>
            }
            {users.map((user, idx) => (
              <Table.Row key={idx} className="cursor-pointer" 
               onClick={() => {setUserToAction({name: user.name, email: user.email, idx: idx}); setViewAccountModalOpen(true);}}>
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
                <Table.Cell className="hidden md:table-cell">
                  {user.role[0].toUpperCase() + user.role.slice(1)}
                </Table.Cell>
                <Table.Cell className="hidden md:table-cell">
                  {user.suspended ? (
                    <div className="flex flex-row gap-2 items-center">
                      <div className="rounded-full bg-red-500 w-2.5 h-2.5"> </div>
                      <Label className="text-gray-500">Suspended</Label>
                    </div>
                  ) : (
                    <div className="flex flex-row gap-2 items-center">
                      <div className="rounded-full bg-green-400 w-2.5 h-2.5"></div>
                      <Label className="text-gray-500">Active</Label>
                    </div>
                  )}
                </Table.Cell>
                <Table.Cell className="hidden md:table-cell">{user.country ? user.country : "-"}</Table.Cell>
                <Table.Cell>
                  <UserActionButton 
                  user={{name: user.name, email: user.email, idx: idx}}
                  setUserToAction={setUserToAction}
                  setSuspendModalOpen={setSuspendAccountModalOpen}
                  setCancelModalOpen={setCancelSubAccountModalOpen} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        </InifiniteScroll>
      )}
    </>
  );
}

export default AdminUsersTable;
