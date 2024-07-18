import { Sidebar } from "flowbite-react";
import { sidebarTheme } from "../theme";
import { HiChartPie } from "react-icons/hi";
import { IoMdPerson, IoIosHelpCircle, IoMdSettings, IoMdPeople } from "react-icons/io";
import { BsStars } from "react-icons/bs";
import { LuSettings2 } from "react-icons/lu";
import { Link } from "react-router-dom";
import { useState } from "react";


function AdminSideBar({setCollapsed, collapsed}) {
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseEnter = () => {
        if (collapsed) {
        setIsHovering(true);
        setCollapsed(false);
        }
    };

    const handleMouseLeave = () => {
        if (isHovering) {
        setIsHovering(false);
        setCollapsed(true);
        }
    };
    return (
        <Sidebar theme={sidebarTheme} className="z-40" collapsed={collapsed} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="flex flex-col justify-between h-full">
                <Sidebar.Items>
                    <Sidebar.ItemGroup>
                        <Sidebar.Item as={Link} to="/admin/dashboard" icon={HiChartPie}>
                            Dashboard
                        </Sidebar.Item>
                        <Sidebar.Item as={Link} to="/admin/users" icon={IoMdPeople}>
                            Users
                        </Sidebar.Item>
                        <Sidebar.Collapse icon={BsStars} label="Big Data">
                            <Sidebar.Item as={Link} to="/admin/images">Images</Sidebar.Item>
                            <Sidebar.Item>Dataset</Sidebar.Item>
                            <Sidebar.Item as={Link} to="/admin/models">Model</Sidebar.Item>
                        </Sidebar.Collapse>
                    </Sidebar.ItemGroup>
                    <Sidebar.ItemGroup>
                        <Sidebar.Item icon={IoMdPerson}>
                            Profile
                        </Sidebar.Item>
                        <Sidebar.Item icon={IoIosHelpCircle}>
                            Settings
                        </Sidebar.Item>
                    </Sidebar.ItemGroup>
                </Sidebar.Items>
                <div className={`p-2 transition-all duration-100 ease-in-out flex ${collapsed ? "flex-col" : ""} gap-8 justify-center items-center`}>
                    <button className="hover:bg-gray-100 p-3 rounded-md">
                        <IoMdSettings className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="hover:bg-gray-100 p-3 rounded-md">
                        <LuSettings2 className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>
        </Sidebar>
    );
}

export default AdminSideBar;