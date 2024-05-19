import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../../Components/Navbar/AdminNavbar";
import AdminSideBar from "../../Components/Navbar/AdminSidebar";

function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <>
            <AdminNavbar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className="flex">
                <AdminSideBar collapsed={collapsed} setCollapsed={setCollapsed} />
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

export default AdminLayout;