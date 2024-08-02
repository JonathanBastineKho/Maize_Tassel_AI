import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import UploadedImageModalTopBar from "./UploadedImageModalTopBar";
import axios from "axios";
import UploadedImageSideBarContent from "./UploadedImageSideBarContent";
import ImageUserCanvas from "../../User/UserImageCanvas";
import AddToDatasetModal from "./AddToDatasetModal";
import { FaCheck } from "react-icons/fa6";
import { HiExclamation } from "react-icons/hi";
import ToastMsg from "../../Other/ToastMsg";

function UploadedImageModal({ images, currImageIdx, setCurrImageIdx }) {
    const navigate = useNavigate();
    const { folder_id, imageName } = useParams();
    const [img, setImg] = useState(null);
    const [label, setLabel] = useState(null);
    const [sideBarOpen, setSideBarOpen] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [addDatasetModalOpen, setAddDatasetModalOpen] = useState(false);

    // Toast Message
    const [successAddToast, setSuccessAddToast] = useState(false);
    const [partialSuccessAddToast, setPartialSuccessAddToast] = useState(false);
    const fetchImage = () => {
        axios
            .get(`/api/service/view-image?folder_id=${encodeURIComponent(folder_id)}&img_name=${encodeURIComponent(imageName)}`)
            .then((res) => {
              setImg({
                name: res.data.name,
                upload_date : res.data.upload_date,
                feedback: res.data.feedback,
                thumbnail_url: res.data.thumbnail_url,
                url: res.data.url
              });
              setLabel(res.data.prediction);
            })
            .catch((err) => {
              if (err.response.status === 401) {
                navigate("/login");
              }
            });
      }

      useEffect(() => {
        if (imageName) {
          fetchImage();
        }
      }, [imageName, navigate]);
    return (
        <div
            className={`fixed z-50 inset-0 bg-black bg-opacity-40 backdrop-blur-md ${
                imageName !== undefined ? "block" : "hidden"
            }`}
        >
            <ToastMsg color="green" icon={<FaCheck className="h-5 w-5" />} open={successAddToast} setOpen={setSuccessAddToast} message="Images successfully added to dataset" />
            <ToastMsg color="red" icon={<HiExclamation className="h-5 w-5" />} open={partialSuccessAddToast} setOpen={setPartialSuccessAddToast} message="Some Images are duplicated (will not add)" />
            <AddToDatasetModal image={[{...img, checked: true, folder_id: folder_id}]} open={addDatasetModalOpen} setOpen={setAddDatasetModalOpen} setSuccessAddToast={setSuccessAddToast} setPartialSuccessAddToast={setPartialSuccessAddToast} />
            {imageName && (<>
                {/* Top Bar */}
                <UploadedImageModalTopBar
                currIdx={currImageIdx}
                setCurrIdx={setCurrImageIdx} 
                sideBarOpen={sideBarOpen} 
                setSideBarOpen={setSideBarOpen} 
                drawerOpen={drawerOpen} 
                setDrawerOpen={setDrawerOpen} 
                images={images} img={img} />
                {/* Side Bar */}
                <div className="flex h-full">
                    {sideBarOpen && (
                        <div className="hidden md:block min-w-[20rem] w-[20rem] bg-white border-r-2 overflow-y-auto">
                            <UploadedImageSideBarContent setAddDatasetModalOpen={setAddDatasetModalOpen} img={img} prediction={label} />
                        </div>)
                    }
                    <div className="md:hidden">

                    </div>
                    {/* Canvas */}
                    <div className="flex-grow">
                        <ImageUserCanvas 
                            sideBarOpen={sideBarOpen}
                            img={img}
                            labels={label}
                        />
                    </div>
                </div>
            </>)}
        </div>
    );
}

export default UploadedImageModal;