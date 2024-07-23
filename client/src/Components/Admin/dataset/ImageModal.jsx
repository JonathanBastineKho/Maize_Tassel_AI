import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ImageModalTopBar from "./ImageModalTopBar";
import { Drawer } from "flowbite-react";
import axios from "axios";
import ImageSideBarContent from "./ImageSidebar";
import ImageAdminCanvas from "./ImageCanvas";

function ImageModal({images, currIdx, setCurrIdx}) {
  const navigate = useNavigate();
  const { dataset_name, folder_id, imageName } = useParams();
  const [img, setImg] = useState(null);
  const [label, setLabel] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [newBoxToggle, setNewBoxToggle] = useState(false);
  const [croppingMode, setCroppingMode] = useState(false);
  const [cropData, setCropData] = useState(null);
  const [sideBarOpen, setSideBarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [imageHasBeenCropped, setImageHasBeenCropped] = useState(false);
  const [imageHasBeenReannotate, setImageHasBeenReannotate] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchImage = () => {
    axios
        .get(`/api/maintenance/view-image?dataset_name=${encodeURIComponent(dataset_name)}&image_name=${encodeURIComponent(imageName)}&folder_id=${folder_id}`)
        .then((res) => {
          setImg({
            name: res.data.name,
            upload_date : res.data.upload_date,
            feedback: res.data.feedback,
            thumbnail_url: res.data.thumbnail_url,
            url: res.data.url
          });
          setLabel(res.data.label);
        })
        .catch((err) => {
          if (err.response.status === 401) {
            navigate("/login");
          }
        });
  }

  const saveChanges = async () => {
    setSaveLoading(true);
    if (imageHasBeenReannotate){
        await axios.patch("/api/maintenance/reannotate-image", {
            image_name: imageName,
            folder_id: folder_id,
            dataset_name: dataset_name,
            new_label: label
        })
        .then((res) => {
            if (res.status === 200){
                setImageHasBeenCropped(false);
                setImageHasBeenReannotate(false);
            }
        })
        .catch((err) => {
            if (err.response.status === 401){
                navigate("/login")
            }
        })
    }
    if (imageHasBeenCropped) {
        await axios.patch("/api/maintenance/crop-image", {
            image_name: imageName,
            folder_id: folder_id,
            dataset_name: dataset_name,
            crop_data: cropData
        })
        .then((res) => {
            if (res.status === 200) {
                setImageHasBeenCropped(false);
                setImageHasBeenReannotate(false);
            }
        })
        .catch((err) => {
            if (err.response.status === 401){
                navigate("/login")
            }
        })
    }
    fetchImage();
    setSaveLoading(false);
  }

  useEffect(() => {
    if (imageName) {
      setImageHasBeenCropped(false);
      setImageHasBeenReannotate(false);
      fetchImage();
    }
  }, [imageName, navigate]);
  return (
    <div
      className={`fixed z-50 inset-0 bg-black bg-opacity-40 backdrop-blur-md ${
        imageName !== undefined ? "block" : "hidden"
      }`}
    >
        {imageName && (<>
            {/* Top Bar */}
        <ImageModalTopBar setDrawerOpen={setDrawerOpen} setSideBarOpen={setSideBarOpen} sideBarOpen={sideBarOpen} img={img} images={images} currIdx={currIdx} setCurrIdx={setCurrIdx} />
        <div className="flex h-full">
            {/* Side Bar */}
            {sideBarOpen && (
                <div className="hidden md:block min-w-[20rem] w-[20rem] bg-white border-r-2 overflow-y-auto">
                    <ImageSideBarContent
                    saveChanges={saveChanges}
                    saveLoading={saveLoading}
                    imageHasBeenCropped={imageHasBeenCropped}
                    imageHasBeenReannotate={imageHasBeenReannotate}
                    setImageHasBeenCropped={setImageHasBeenCropped}
                    setImageHasBeenReannotate={setImageHasBeenReannotate}  
                    croppingMode={croppingMode} setCroppingMode={setCroppingMode} newBoxToggle={newBoxToggle} setNewBoxToggle={setNewBoxToggle} selectedBox={selectedBox} setSelectedBox={setSelectedBox} setLabel={setLabel} label={label} img={img} />
                </div>
                )
            }
            <div className="md:hidden">
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <ImageSideBarContent
                saveChanges={saveChanges}
                saveLoading={saveLoading}
                imageHasBeenCropped={imageHasBeenCropped}
                imageHasBeenReannotate={imageHasBeenReannotate}
                setImageHasBeenCropped={setImageHasBeenCropped}
                setImageHasBeenReannotate={setImageHasBeenReannotate} 
                croppingMode={croppingMode} setCroppingMode={setCroppingMode} newBoxToggle={newBoxToggle} setNewBoxToggle={setNewBoxToggle} setLabel={setLabel} label={label} img={img} />
            </Drawer>
            </div>
            {/* Canvas */}
            <div className="flex-grow">
                <ImageAdminCanvas
                setImageHasBeenCropped={setImageHasBeenCropped}
                setImageHasBeenReannotate={setImageHasBeenReannotate} 
                cropData={cropData} setCropData={setCropData} croppingMode={croppingMode} newBoxToggle={newBoxToggle} setNewBoxToggle={setNewBoxToggle} selectedBox={selectedBox} setSelectedBox={setSelectedBox} sideBarOpen={sideBarOpen} img={img} labels={label} setLabel={setLabel} />
            </div>
        </div>
        </>
            
        )}
        
    </div>
  );
}

export default ImageModal;
