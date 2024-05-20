import { Table, Spinner, Avatar, Label } from "flowbite-react";
import { tableTheme } from "../theme";
import { useEffect, useState } from "react";
import axios from "axios";
import { spinnerTheme } from "../theme";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useNavigate, useLocation } from "react-router-dom";
import InifiniteScroll from "react-infinite-scroll-component";

function AdminUsersTable() {
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
      {loading ? (
        <div className="mt-8 flex items-center justify-center">
          <Spinner className="" theme={spinnerTheme} />
        </div>
      ) : (
        <div className="h-full overflow-y-auto">
        <InifiniteScroll
              dataLength={users.length}
              next={fetchUsers}
              hasMore={hasMore}
              scrollThreshold={0.8}
              loader={
                <div className="mt-8 flex items-center justify-center">
                  <Label className="text-gray-500">Loading...</Label>
                </div>
              }
            >
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
          <Table.Body>
            {users.map((user, idx) => (
              <Table.Row key={idx}>
                <Table.Cell>
                  <div className="flex flex-row gap-8">
                    <Avatar rounded img={user.profile_pict} />
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
                      <div className="rounded-full bg-red w-2.5 h-2.5"> </div>
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
                  <div className="w-fit p-2 rounded-md hover:bg-gray-100">
                    <BsThreeDotsVertical />
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        </InifiniteScroll>
        </div>
      )}
    </>
  );
}

export default AdminUsersTable;
