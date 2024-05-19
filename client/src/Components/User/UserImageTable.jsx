import axios from "axios";
import { io } from "socket.io-client";
import { Checkbox, Table, Badge, Avatar, Spinner, Label } from "flowbite-react";
import { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useNavigate, useParams } from "react-router-dom";
import { spinnerTheme, tableTheme } from "../theme";
import UserImageModal from "./UserImageModal";
import ActionButton from "./ActionButton";

function UserImageTable({ setDeleteModalOpen, setImageToAction, image, setImage, folder, setFolder }) {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currImageIdx, setCurrImageIdx] = useState(0);
  useEffect(() => {
    setLoading(true);
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
          if (prev.hasOwnProperty(updatedImage.name)) {
            return {
              ...prev,
              [updatedImage.name]: {
                ...prev[updatedImage.name],
                status: updatedImage.status,
              },
            };
          }
          return prev;
        });
      });
    };
    let url = "/api/service/search-item";
    if (folderId) {
      url = `/api/service/search-item?folder_id=${folderId}`;
    }
    axios
      .get(url)
      .then((res) => {
        if (res.status === 200) {
          setImage(res.data.images);
          setFolder(res.data.folders);
          connectToWebSocket();
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
      return () => {
        socket.disconnect();
      };
  }, [folderId]);

  return (
    <>
      <UserImageModal
        imageList={Object.entries(image)}
        index={currImageIdx}
        setIndex={setCurrImageIdx}
      />
      {loading ? (
        <div className="mt-8 flex items-center justify-center">
          <Spinner className="" theme={spinnerTheme} />
        </div>
      ) : (
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
                  <Table.Row>
                    <Table.Cell className="">
                      <Checkbox />
                    </Table.Cell>
                    <Table.Cell>
                      <Label>{fldr.name}</Label>
                    </Table.Cell>
                    <Table.Cell>
                      <Label>-</Label>
                    </Table.Cell>
                    <Table.Cell>
                      <Label>-</Label>
                    </Table.Cell>
                    <Table.Cell>
                      <Label>{fldr.create_date}</Label>
                    </Table.Cell>
                    <Table.Cell>
                      <BsThreeDotsVertical />
                    </Table.Cell>
                  </Table.Row>
              ))}
              {Object.entries(image).map(([key, img], index) => (
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
      )}
    </>
  );
}

export default UserImageTable;
