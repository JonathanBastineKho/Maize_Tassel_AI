import { Table, Label, Avatar, Card } from "flowbite-react";
import { tableTheme } from "../../theme";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useRef, useEffect } from "react";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import { format } from "date-fns";
import ImageModal from "./ImageModal";

function ImageTableGrid({ images, setImages, rowView }) {
  const navigate = useNavigate();
  const { dataset_name } = useParams();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currIdx, setCurrIdx] = useState(0);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const search = searchParams.get("search") || "";
  const abortControllerRef = useRef(null);

  const LoadingRow = () => (
    <Table.Row className="animate-pulse">
      <Table.Cell className="w-fit md:w-auto">
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </Table.Cell>
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

  const fetchItem = (
    currentPage = page,
    currentImageLength = images.length
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    axios
      .get(
        `/api/maintenance/search-images?search=${search}&page=${currentPage}&page_size=20&dataset_name=${encodeURIComponent(dataset_name)}`
      )
      .then((res) => {
        if (res.status === 200) {
          const newImages = res.data.images.map((img) => ({
            ...img,
            checked: false, // Add the checked property
          }));
          if (currentPage === 1) {
            setImages(newImages);
          } else {
            setImages((prev) => [...prev, ...newImages]);
          }
          setPage(currentPage + 1);
          setHasMore(res.data.has_more);
          if (res.data.has_more && currentImageLength < 20) {
            fetchItem(
              currentPage + 1,
              currentImageLength + res.data.images.length
            ); // Fetch more items immediately
          }
        }
      })
      .catch((err) => {
        if (err.response.status === 401) {
          navigate("/login");
        } else if (err.response.status === 500) {
          setHasMore(false);
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
      fetchItem(1, 0);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [page, search]);

  if (rowView) {
    return (
    <>
    <ImageModal currIdx={currIdx} setCurrIdx={setCurrIdx} images={images} />
    <InfiniteScroll
        className="mb-48"
        dataLength={images.length}
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
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell className="text-center">
              Tassel Count
            </Table.HeadCell>
            <Table.HeadCell>Upload Date</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {loading
              ? Array(5)
                  .fill(0)
                  .map((_, index) => <LoadingRow key={`loading-${index}`} />)
              : images.map((img, idx) => (
                  <Table.Row
                  onClick={() => {
                    setCurrIdx(idx);
                    navigate(`/admin/datasets/test/${img.folder_id}/${encodeURI(img.name)}`)}} 
                  className="cursor-pointer" key={idx}>
                    <Table.Cell className="w-full md:w-auto whitespace-nowrap font-medium text-gray-900 flex flex-row gap-2 items-center ">
                      <Avatar size="xs" img={img.thumbnail_url} />
                      <Label className="truncate max-w-64">{img.name}</Label>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      {img.tassel_count}
                    </Table.Cell>
                    <Table.Cell>
                      {format(img.upload_date, "MMMM dd, yyyy")}
                    </Table.Cell>
                  </Table.Row>
                ))}
          </Table.Body>
        </Table>
      </InfiniteScroll>
    </>
    );
  } else {
    return (
        <>
        <ImageModal currIdx={currIdx} setCurrIdx={setCurrIdx} images={images} />
        <InfiniteScroll
        className="mb-48"
        dataLength={images.length}
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
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {loading
          ? Array(5)
              .fill(0)
              .map((_, index) => <LoadingRow key={`loading-${index}`} />)
          : images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => {
                    setCurrIdx(idx);
                    navigate(`/admin/datasets/test/${img.folder_id}/${encodeURI(img.name)}`)}}
                className="cursor-pointer flex flex-col h-48 bg-white border border-gray-200 rounded-lg shadow"
              >
                <div className="flex-grow overflow-hidden rounded-t-lg">
                  <img
                    src={img.thumbnail_url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <Label className="truncate block text-sm font-medium text-gray-900 dark:text-white">
                    {img.name}
                  </Label>
                </div>
              </div>
            ))}
      </div>
      </InfiniteScroll>
      </>
    );
  }
}

export default ImageTableGrid;
