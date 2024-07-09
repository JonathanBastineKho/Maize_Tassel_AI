import { Table, Checkbox, Label, Avatar, Badge } from "flowbite-react";
import { tableTheme } from "../../theme";
import axios from "axios";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import InifiniteScroll from "react-infinite-scroll-component";
import { format } from 'date-fns';
import { BsThreeDotsVertical } from "react-icons/bs";

function AdminImageTable({ image, setImage }) {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const search = searchParams.get("search") || "";

  const fetchItem = (currentPage = page, currentImageLength = image.length) => {
    axios
      .get(`/api/maintenance/search-images?search=${search}&page=${currentPage}&page_size=30`)
      .then((res) => {
        if (res.status === 200) {
          if (currentPage === 1) {
            setImage(res.data.images);
          } else {
            setImage((prev) => [...prev, ...res.data.images]);
          }
          setPage(currentPage + 1);
          setHasMore(res.data.has_more);
          if (res.data.has_more && currentImageLength< 30) {
            fetchItem(currentPage + 1, currentImageLength + res.data.images.length); // Fetch more items immediately
          }
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

  const LoadingRow = () => (
    <Table.Row className="animate-pulse">
      <Table.Cell className="w-fit md:w-auto"><div className="h-4 w-4 bg-gray-200 rounded"></div></Table.Cell>
      <Table.Cell className="w-full md:w-auto">
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-gray-200 h-8 w-8"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </Table.Cell>
      <Table.Cell className="hidden md:table-cell">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </Table.Cell>
      <Table.Cell className="hidden md:table-cell">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </Table.Cell>
    </Table.Row>
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page === 1) {
      fetchItem(1, 0);
    }
  }, [page, search]);

  return (
    <InifiniteScroll
      className="mb-48"
      dataLength={image.length}
      next={fetchItem}
      hasMore={hasMore}
      scrollThreshold={0.8}
      style={{ overflow: "visible" }}
      loader={
        <div className="mt-4 flex items-center justify-center">
          <Label className="text-gray-500">Loading...</Label>
        </div>
      }
    >
      <Table hoverable theme={tableTheme}>
        <Table.Head>
          <Table.HeadCell>
            <Checkbox />
          </Table.HeadCell>
          <Table.HeadCell className="w-full md:w-auto">Name</Table.HeadCell>
          <Table.HeadCell className="hidden md:table-cell min-w-32">Status</Table.HeadCell>
          <Table.HeadCell className="hidden md:table-cell min-w-32">Upload date</Table.HeadCell>
          <Table.HeadCell>
            <span className="sr-only">Action</span>
          </Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
        {loading ? (
            Array(5).fill(0).map((_, index) => <LoadingRow key={`loading-${index}`} />)
          ) : (
            image.map((img, idx) => (
              <Table.Row className="cursor-pointer" key={idx}>
                <Table.Cell className="w-fit md:w-auto"><Checkbox /></Table.Cell>
                <Table.Cell className="w-full md:w-auto whitespace-nowrap font-medium text-gray-900 flex flex-row gap-2 items-center ">
                  <Avatar size="xs" img={img.thumbnail_url} />
                  <Label className="truncate max-w-64">{img.name}</Label>
                </Table.Cell>
                <Table.Cell className="hidden md:table-cell">
                  <Badge className="w-fit" color="success">
                    Done
                  </Badge>
                </Table.Cell>
                <Table.Cell className="hidden md:table-cell">
                  <Label className="text-gray-500">{format(new Date(img.upload_date), 'MMMM d, yyyy')}</Label>
                </Table.Cell>
                <Table.Cell>
                  <BsThreeDotsVertical />
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </InifiniteScroll>
  );
}

export default AdminImageTable;
