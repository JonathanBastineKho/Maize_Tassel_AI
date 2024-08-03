import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../../Components/Navbar/AdminNavbar";
import AdminSideBar from "../../Components/Navbar/AdminSidebar";
import AdminDrawer from "../../Components/Navbar/AdminDrawer";

function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    return (
        <>
            <AdminNavbar onDrawerToggle={() => setIsDrawerOpen(!isDrawerOpen)} collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className="flex">
                <div className={`hidden md:block ${collapsed ? "md:mr-16" : "md:mr-[16.3rem]"}`}>
                    <AdminSideBar collapsed={collapsed} setCollapsed={setCollapsed} />
                </div>
                <div className={`w-full flex-grow transition-all duration-100 ease-in-out`}>
                    <Outlet />
                </div>
            </div>
            <div className="md:hidden">
                <AdminDrawer open={isDrawerOpen} setOpen={setIsDrawerOpen}  />
            </div>
        </>
    );
}

export default AdminLayout;