import { Table, Checkbox, Label, Avatar, Badge } from "flowbite-react";
import { checkBoxTheme, tableTheme } from "../../theme";
import axios from "axios";
import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InifiniteScroll from "react-infinite-scroll-component";
import { format } from 'date-fns';
import { BsThreeDotsVertical } from "react-icons/bs";
import UploadedImageModal from "./UploadedImageModal";

function AdminImageTable({ image, setImage }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currImageIdx, setCurrImageIdx] = useState(0);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const search = searchParams.get("search") || "";
  const filterBadFeedbackParam = searchParams.get("filter_bad_feedback") === "true";
  const abortControllerRef = useRef(null);

  const fetchItem = (currentPage = page, currentImageLength = image.length) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    axios
      .get(`/api/maintenance/search-images?search=${search}&page=${currentPage}&page_size=20&filter_bad_feedback=${filterBadFeedbackParam}`)
      .then((res) => {
        if (res.status === 200) {
          const newImages = res.data.images.map(img => ({
            ...img,
            checked: false // Add the checked property
          }));
          if (currentPage === 1) {
            setImage(newImages);
          } else {
            setImage((prev) => [...prev, ...newImages]);
          }
          setPage(currentPage + 1);
          setHasMore(res.data.has_more);
          if (res.data.has_more && currentImageLength < 20) {
            fetchItem(currentPage + 1, currentImageLength + res.data.images.length); // Fetch more items immediately
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

  const areAllChecked = useMemo(() => {
    return image.length > 0 && image.every(img => img.checked);
  }, [image]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [search, filterBadFeedbackParam]);

  useEffect(() => {
    if (page === 1) {
      fetchItem(1, 0);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [page, search, filterBadFeedbackParam]);

  return (
    <>
    <UploadedImageModal images={image} currImageIdx={currImageIdx} setCurrImageIdx={setCurrImageIdx} />
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
            <Checkbox 
            checked={areAllChecked}
            onChange={(e) => {
              e.stopPropagation();
              setImage(prevImages => prevImages.map(img => ({ ...img, checked: e.target.checked })));
            }}
            theme={checkBoxTheme} />
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
              <Table.Row 
              onClick={() => {
                const currentParams = new URLSearchParams(location.search);
                const paramsString = currentParams.toString();
                navigate(`/admin/images/${img.folder_id}/${img.name}${paramsString ? `?${paramsString}` : ''}`);
              }}
              className="cursor-pointer" key={idx}>
                <Table.Cell className="w-fit md:w-auto">
                  <Checkbox
                    theme={checkBoxTheme}
                    checked={img.checked}
                    onClick={(e) => e.stopPropagation()} 
                    onChange={(e) => {
                      e.stopPropagation();
                      setImage(prevImages => {
                        const newImages = [...prevImages];
                        newImages[idx] = { ...newImages[idx], checked: !newImages[idx].checked };
                        return newImages;
                      });
                    }}
                  />
                  </Table.Cell>
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
    </>
  );
}

export default AdminImageTable;
