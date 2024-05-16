import { Modal } from "flowbite-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function UserImageModal({ imgName, setImgName }) {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (imgName) {
      setLoading(true);
      const url = folderId
        ? `/api/service/view-image?img_name=${imgName}&folder_id=${folderId}`
        : `/api/service/view-image?img_name=${imgName}`;

      axios
        .get(url)
        .then((res) => {
          setImg(res.data);
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
  }, [imgName]);

  const handleImageLoad = (e) => {
    setImgSize({ width: e.target.width, height: e.target.height });
  };

  return (
    <Modal
      show={imgName !== null}
      size="3xl"
      onClose={() => {
        setImgName(null);
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center w-full h-72 bg-gray-300 rounded-lg sm:w-96 dark:bg-gray-700">
          <svg
            className="w-10 h-10 text-gray-200 dark:text-gray-600"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 18"
          >
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
          </svg>
        </div>
      ) : (
        <div>
          <div className="relative">
            <img src={img.url} alt="Image" className="w-full h-auto" onLoad={handleImageLoad} />
            {img.status === "done" ? 
                (img.prediction.map((prediction, key) => (
                    <div
                      key={key}
                      className="absolute border-2 border-red-500"
                      style={{
                        left: (prediction.xCenter - prediction.width / 2) * (imgSize.width / img.width),
                        top: (prediction.yCenter - prediction.height / 2) * (imgSize.height/img.height),
                        width: prediction.width * (imgSize.width / img.width),
                        height: prediction.height * (imgSize.height/img.height),
                      }}
                    />
                  ))) :
                  null
            }
            
          </div>
        </div>
      )}

      {/* <Modal.Body>Hello</Modal.Body> */}
    </Modal>
  );
}

export default UserImageModal;
