import { TextInput, Button } from "flowbite-react";
import AdminBreadCrumb from "../../Components/Admin/dataset/BreadCrumb";
import { inputTheme } from "../../Components/theme";
import { PiStarFourFill } from "react-icons/pi";
import { IoGrid as OriginalIoGrid } from "react-icons/io5";
import { MdTableRows as OriginalMdTableRows } from "react-icons/md";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ImageTableGrid from "../../Components/Admin/dataset/ImageTableGrid";


function AdminDatasetImagePage(){
    const navigate = useNavigate();
    const { dataset_name } = useParams();
    const [images, setImages] = useState([]);
    const [rowView, setRowView] = useState(true);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchValue = searchParams.get("search") || "";
    const [inputValue, setInputValue] = useState(searchValue);
    // To remove warnings
    const IoGrid = (props) => {
        const { positionInGroup, ...restProps } = props;
        return <OriginalIoGrid {...restProps} />;
    };
      const MdTableRows = (props) => {
        const { positionInGroup, ...restProps } = props;
        return <OriginalMdTableRows {...restProps} />;
    };
    
    return (
        <div className="mt-24 px-5">
            <AdminBreadCrumb />
            <h1 className="font-bold text-2xl my-4">Dataset Images</h1>
            <div className="flex flex-row w-full items-center flex-wrap gap-4 justify-between mb-5">
                <TextInput
                    theme={inputTheme}
                    icon={PiStarFourFill}
                    placeholder="Intelligence Search" 
                    className="w-full md:w-96"
                    value={inputValue}
                    onChange={(e) => {setInputValue(e.target.value)}}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            navigate(`/admin/datasets/${dataset_name}?search=${encodeURIComponent(inputValue)}`);
                        }
                    }}
                />
                <Button.Group>
                    <Button onClick={()=>{setRowView(false)}} color="gray" className={`focus:ring-gray-300 ${rowView ? '' : 'bg-gray-200'}`}>
                        <IoGrid className="text-gray-500" />
                    </Button>
                    <Button onClick={()=>{setRowView(true)}} color="gray" className={`focus:ring-gray-300 ${rowView ? 'bg-gray-200' : ''}`}>
                        <MdTableRows className="text-gray-500" />
                    </Button>
                </Button.Group>
            </div>
            {/* Image View */}
            <ImageTableGrid images={images} setImages={setImages} rowView={rowView} />
        </div>
    );
}

export default AdminDatasetImagePage;