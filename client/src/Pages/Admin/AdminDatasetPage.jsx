import { Button, Table, TextInput, Label } from "flowbite-react";
import AdminBreadCrumb from "../../Components/Admin/dataset/BreadCrumb";
import { HiSearch } from "react-icons/hi";
import { FaFolder } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { inputTheme, tableTheme } from "../../Components/theme";
import InifiniteScroll from "react-infinite-scroll-component";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import CreateDatasetModal from "../../Components/Admin/dataset/CreateDatasetModal";

function AdminDatasetPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const search = searchParams.get("search") || "";
    const [inputValue, setInputValue] = useState(search);

    const [page, setPage] = useState(1);
    const [datasets, setDatasets] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [createDatasetOpen, setCreateDatasetOpen] = useState(false);
    const fetch = () => {
        const params = {
            page: page,
            page_size: 20,
            dataset: search
        }
        axios.get("/api/maintenance/search-dataset", { params })
        .then((res) => {
            if (res.status === 200) {
                if (page === 1) {
                    setDatasets(res.data.dataset);
                } else {
                    setDatasets((prev) => [...prev, ...res.data.dataset]);
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
    }

    useEffect(() => {
        setPage(1);
      }, [search])

    useEffect(() => {
        if (page === 1) {
          fetch();
        }
      }, [page, search]);

    const timeoutRef = useRef(null);
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            navigate(`/admin/datasets?search=${value}`);
        }, 400);
    };

    const handleKeyDown = (e) => {
    if (e.key === "Enter") {
        if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        }
        navigate(`/admin/datasets?search=${inputValue}`);
    }
    };
    return (
        <div className="mt-24 px-5">
            <AdminBreadCrumb />
            <CreateDatasetModal setDatasets={setDatasets} open={createDatasetOpen} setOpen={setCreateDatasetOpen} />
            <h1 className="font-bold text-2xl my-4">Your Datasets</h1>
            <div className="flex flex-row justify-between items-center w-full flex-wrap gap-4">
                <TextInput
                theme={inputTheme}
                icon={HiSearch}
                placeholder="Search Your Dataset" 
                className="w-full md:w-96"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                />
                <Button onClick={()=>{setCreateDatasetOpen(true)}} className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-600">
                    Create Dataset
                </Button>
            </div>
            <InifiniteScroll
            dataLength={datasets.length}
            next={fetch}
            hasMore={hasMore}
            scrollThreshold={0.8}
            style={{ overflow: 'visible' }}
            loader={
              <div className="mt-8 flex items-center justify-center">
                <Label className="text-gray-500">Loading...</Label>
              </div>
            }
            >
                <Table className="mt-4" hoverable theme={tableTheme}>
                    <Table.Head>
                        <Table.HeadCell>Dataset Name</Table.HeadCell>
                        <Table.HeadCell className="hidden md:table-cell">Create Date</Table.HeadCell>
                        <Table.HeadCell>
                            <span className="sr-only">Action</span>
                        </Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {datasets.length === 0 && 
                            <Table.Row>
                                <Table.Cell colSpan={5} className="text-center">
                                    <span className="text-gray-500 text-center">No dataset available</span>
                                </Table.Cell>
                            </Table.Row>
                        }
                        {datasets.map((dataset, idx) => (
                            <Table.Row key={idx} 
                            onClick={() => {navigate(`/admin/datasets/${encodeURI(dataset.name)}`)}}
                            className="cursor-pointer">
                                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 flex flex-row gap-4 items-center">
                                    <FaFolder className="text-gray-500 w-6 h-6" />
                                    <Label className="truncate max-w-72">{dataset.name}</Label>
                                </Table.Cell>
                                <Table.Cell className="hidden md:table-cell">
                                    {format(dataset.create_date, "MMMM dd, yyyy")}
                                </Table.Cell>
                                <Table.Cell>
                                    <BsThreeDotsVertical />
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </InifiniteScroll>
        </div>
    );
}

export default AdminDatasetPage;