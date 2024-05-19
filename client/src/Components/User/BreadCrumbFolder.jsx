import { Breadcrumb, Spinner } from "flowbite-react";
import { useEffect, useState, useContext } from "react";
import { HiHome } from "react-icons/hi";
import { spinnerTheme } from "../theme";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../Authentication/AuthContext";
import axios from "axios";

function BreadcrumbFolder({ folder, setFolder }) {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    let url = '/api/service/parent-folders';
    if (folderId) {
      url = `/api/service/parent-folders?folder_id=${folderId}`;
    }
    axios.get(url)
    .then((res) => {
      if(res.status === 200) {
          setFolder(res.data.parent_folders);
      } else if (res.status === 400) {
          navigate("/"); // Navigate to 404 page
      } else if (res.status === 401) {
          setUser(null);
          navigate("/login"); // Session expired or invalid
      }
  })
  .catch((err) => {})
  .then(() => {setLoading(false)})
  }, [folderId])

  return (
    <>
      {loading ? (
        <Spinner theme={spinnerTheme} />
      ) : (
        <Breadcrumb aria-label="folder structure" className="mb-1.5">
          {folder.map((item, index) => (
            <Link key={index} to={index === 0 ? "/user/images" : `/user/images/${item.id}`}>
              <Breadcrumb.Item
                key={index}
                icon={index === 0 ? HiHome : undefined}
              >
                {item.name}
              </Breadcrumb.Item>
            </Link>
          ))}
          <Breadcrumb.Item></Breadcrumb.Item>
        </Breadcrumb>
      )}
    </>
  );
}

export default BreadcrumbFolder;
