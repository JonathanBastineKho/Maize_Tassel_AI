import { Breadcrumb } from "flowbite-react";
import { HiHome } from "react-icons/hi";
import { Link, useParams } from "react-router-dom";

function AdminBreadCrumb() {
  const { dataset } = useParams();
  return (
    <Breadcrumb>
      <Breadcrumb.Item icon={HiHome}>
        <Link to="/admin/datasets">
          Home
        </Link>
      </Breadcrumb.Item>
      {dataset && <Breadcrumb.Item href="#">{dataset}</Breadcrumb.Item>}
    </Breadcrumb>
  );
}

export default AdminBreadCrumb;
