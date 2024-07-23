import { Breadcrumb } from "flowbite-react";
import { HiHome } from "react-icons/hi";
import { Link, useParams } from "react-router-dom";

function AdminBreadCrumb() {
  const { dataset_name } = useParams();
  return (
    <Breadcrumb>
      <Breadcrumb.Item icon={HiHome}>
        <Link to="/admin/datasets">
          Home
        </Link>
      </Breadcrumb.Item>
      {dataset_name && <Breadcrumb.Item href="#">{decodeURI(dataset_name)}</Breadcrumb.Item>}
    </Breadcrumb>
  );
}

export default AdminBreadCrumb;
