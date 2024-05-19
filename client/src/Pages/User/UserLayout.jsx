import { Outlet } from "react-router-dom";
import UserNavbar from "../../Components/Navbar/UserNavbar";
import UserSideBar from "../../Components/Navbar/UserSidebar";
import { useState } from "react";

function UserLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      <UserNavbar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex">
        <UserSideBar setCollapsed={setCollapsed} collapsed={collapsed} />
        <div
          className={`w-screen ${
            collapsed ? "ml-16" : "ml-[16.3rem]"
          } transition-all duration-100 ease-in-out`}
        >
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default UserLayout;
