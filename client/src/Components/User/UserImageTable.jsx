import axios from "axios";
import { io } from "socket.io-client";
import { Checkbox, Table, Badge, Avatar, Spinner, Label } from "flowbite-react";
import { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaFolder } from "react-icons/fa";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { spinnerTheme, tableTheme } from "../theme";
import UserImageModal from "./UserImageModal";
import ActionButton from "./ActionButton";
import InifiniteScroll from "react-infinite-scroll-component";

function UserImageTable({ setDeleteModalOpen, setImageToAction, image, setImage, folder, setFolder }) {
  const { folderId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const search = searchParams.get("search") || "";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [currImageIdx, setCurrImageIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const fetchItem = () => {
    let url = `/api/service/search-item?search=${search}&page=${page}&page_size=20`;
    if (folderId) {
      url = `/api/service/search-item?folder_id=${folderId}&search=${search}&page=${page}&page_size=20`;
    }
    axios
      .get(url)
      .then((res) => {
        if (res.status === 200) {
          if (page === 1){
            setImage({item : new Map(res.data.images)});
            setFolder(res.data.folders);
          } else {
            setFolder(prev => [...prev, ...res.data.folders]);
            setImage((prev) => {
              res.data.images.map(([key, value]) => prev.item.set(key, value));
              return {item: prev.item}
            });
            
          }
          setPage((prevPage) => prevPage + 1);
          setHasMore(res.data.images.length+res.data.folders.length === 20);
          
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
  }

  useEffect(() => {
    let socket;
    const connectToWebSocket = () => {
      socket = io("http://localhost:8000", {
        path: "/job_socket",
        withCredentials: true,
      });

      socket.on("connect", () => {
        console.log("Connected");
      });

      socket.on("image_status_update", (updatedImage) => {
        setImage((prev) => {
          if (prev.item.has(updatedImage.name)){
            prev.item.set(updatedImage.name, {
              ...(prev.item.get(updatedImage.name)),
              status: updatedImage.status,
            })
          }
          return {item: prev.item}
        });
      });
    };
    connectToWebSocket();
    return () => {
      socket.disconnect();
    };
  }, [])

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [search, folderId]);

  useEffect(() => {
    if (page === 1) {
      fetchItem();
    }
  }, [page, search, folderId]);


  return (
    <>
      <UserImageModal
        imageList={[...image.item].map(([key, info]) => ({
          name: key,
          ...info
      }))}
        index={currImageIdx}
        setIndex={setCurrImageIdx}
      />
      {loading ? (
        <div className="mt-8 flex items-center justify-center">
          <Spinner className="" theme={spinnerTheme} />
        </div>
      ) : (
        <div className="h-full overflow-y-auto">
        <InifiniteScroll
              dataLength={image.item.size+folder.length}
              next={fetchItem}
              hasMore={hasMore}
              scrollThreshold={0.8}
              loader={
                <div className="mt-8 flex items-center justify-center">
                  <Label className="text-gray-500">Loading...</Label>
                </div>
              }
            >
          <Table hoverable theme={tableTheme}>
            <Table.Head className="p-4">
              <Table.HeadCell>
                <Checkbox />
              </Table.HeadCell>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Size</Table.HeadCell>
              <Table.HeadCell className="min-w-32">Status</Table.HeadCell>
              <Table.HeadCell>Date Uploaded</Table.HeadCell>
              <Table.HeadCell>
                <span className="sr-only">Action</span>
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {folder.map((fldr, index) => (
                  <Table.Row className="cursor-pointer" key={index} onClick={() => {
                    navigate(`/user/images/${fldr.id}`)
                  }}>
                    <Table.Cell className="">
                      <Checkbox />
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 flex flex-row gap-2 items-center">
                      <FaFolder className="text-gray-500 w-6 h-6" />
                      <Label className="truncate max-w-72">{fldr.name}</Label>
                    </Table.Cell>
                    <Table.Cell>
                      -
                    </Table.Cell>
                    <Table.Cell>
                      -
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(fldr.create_date).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    </Table.Cell>
                    <Table.Cell>
                      <BsThreeDotsVertical />
                    </Table.Cell>
                  </Table.Row>
              ))}
              {[...image.item].map(([key, img], index) => (
                <Table.Row key={index} className="cursor-pointer" onClick={()=>{
                  setCurrImageIdx(index);
                  if (folderId){
                    navigate(`/user/images/${folderId}/${key}`);
                  } else {
                    navigate(`/user/images/root/${key}`);
                  }
                  }}>
                  <Table.Cell>
                    <Checkbox />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 flex flex-row gap-2 items-center">
                    <Avatar size="xs" img={img.thumbnail_url} />
                    <Label className="truncate max-w-72">{key}</Label>
                  </Table.Cell>
                  <Table.Cell>{img.size} MB</Table.Cell>
                  <Table.Cell>
                    {img.status === "in_queue" ? (
                      <Badge className="w-fit" color="gray">
                        In Queue
                      </Badge>
                    ) : img.status === "processing" ? (
                      <Badge className="w-fit" color="warning">
                        Processing
                      </Badge>
                    ) : img.status === "done" ? (
                      <Badge className="w-fit" color="success">
                        Done
                      </Badge>
                    ) : img.status === "error" ? (
                      <Badge className="w-fit" color="failure">
                        Error
                      </Badge>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(img.upload_date).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Table.Cell>
                  <Table.Cell>
                    <ActionButton imgName={key} setImageToAction={setImageToAction} setDeleteModalOpen={setDeleteModalOpen}/>
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

export default UserImageTable;
