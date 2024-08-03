import axios from "axios";
import { Button, Label, Modal, Radio, Table, TextInput } from "flowbite-react";
import { HiSearch } from "react-icons/hi";
import { useCallback, useEffect, useState } from "react";
import { inputTheme } from "../../theme";
import { useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";

function AddToDatasetModal({ image, open, setOpen, setSuccessAddToast, setPartialSuccessAddToast }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDatasetIdx, setSelectedDatasetIdx] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const checkedCount = image.filter(item => item.checked);
  const close = () => {
    setOpen(false);
    setSearch("");
    setErrorMsg("");
  }

  const fetch = useCallback(() => {
    axios
        .get(
          `/api/maintenance/search-dataset?dataset=${encodeURIComponent(
            debouncedSearch
          )}&page=${page}&page_size=20`
        )
        .then((res) => {
            if (res.status === 200) {
                if (page === 1) {
                    setDatasets(res.data.dataset);
                } else {
                    setDatasets((prev) => [...prev, ...res.data.dataset])
                }
                setPage((prevPage) => prevPage + 1);
                setHasMore(res.data.dataset.length === 20);
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
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
  
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setSelectedDatasetIdx(null);
  }, [debouncedSearch, open])

  useEffect(() => {
    if (open && page === 1) {
      fetch();
    }
  }, [open, page, debouncedSearch, fetch]);

  const handleAddDataset = () => {
    if (selectedDatasetIdx !== null) {
        setBtnLoading(true);
        axios.post("/api/maintenance/add-image", {
          dataset: { name : datasets[selectedDatasetIdx].name},
          images: checkedCount.map(img => ({
            name: img.name,
            folder_id: img.folder_id
          }))
        })
        .then((res) => {
          if (res.status === 200) {
            setSuccessAddToast(true);
            close();
          } else if (res.status === 206){
            setPartialSuccessAddToast(true);
            close();
          }
        })
        .catch((err) => {
          if (err.response.status === 401) {
            navigate("/login");
          } else if (err.response.status === 400) {
            setErrorMsg(err.response.data.detail);
          }
        })
        .finally(() => {setBtnLoading(false)})
    }
  }

  return (
    <Modal show={open} onClose={() => close()} size="lg">
        <Modal.Header>
            Add {checkedCount.length} images to Dataset
        </Modal.Header>
      <Modal.Body>
        <TextInput
          theme={inputTheme}
          icon={HiSearch}
          placeholder="Search dataset"
          value={search}
          onChange={(e) => {setSearch(e.target.value)}}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
                setDebouncedSearch(search);
            }
          }}
          color={errorMsg === "" ? "gray" : "failure"}
          helperText={<span className="font-medium">{errorMsg}</span>}
        />
        <div className="my-5 h-56 overflow-auto">
            {loading ? (
                <div className="w-full text-center">
                    <Label className="text-gray-500">Loading</Label>
                </div>
            ) : (
                <InfiniteScroll
                dataLength={datasets.length}
                next={fetch}
                hasMore={hasMore}
                loader={
                    <div className="mt-8 flex items-center justify-center">
                    <Label className="text-gray-500">Loading...</Label>
                    </div>
                }>
                    <Table hoverable>
                      <Table.Body>
                    {datasets.map((dataset, idx) => (
                                <Table.Row
                                key={idx} 
                                onClick={() => {setSelectedDatasetIdx(idx)}}
                                className={selectedDatasetIdx === idx ? "bg-gray-100 cursor-pointer" : "cursor-pointer"}>
                                    <Table.Cell>
                                    <Label htmlFor={idx} className="tex-sm">
                                        {dataset.name}
                                    </Label>
                                    </Table.Cell>
                                </Table.Row>
                    ))}
                      </Table.Body>
                    </Table>
                </InfiniteScroll>
            )}
            
        </div>
        <div className="flex flex-row w-full gap-3">
          <Button
            disabled={btnLoading || selectedDatasetIdx === null}
            className={`w-full bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
              btnLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={handleAddDataset}
          >
            Add to Dataset
          </Button>
          <Button
            className="w-full focus:ring-4 focus:ring-green-300"
            color="light"
            onClick={() => {
              close();
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default AddToDatasetModal;