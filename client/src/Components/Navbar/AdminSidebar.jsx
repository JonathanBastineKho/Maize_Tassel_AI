import { Sidebar } from "flowbite-react";
import { sidebarTheme } from "../theme";
import { HiChartPie } from "react-icons/hi";
import { IoMdPeople } from "react-icons/io";
import { BsStars } from "react-icons/bs";
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
                            <Sidebar.Item as={Link} to="/admin/datasets">Dataset</Sidebar.Item>
                            <Sidebar.Item as={Link} to="/admin/models">Model</Sidebar.Item>
                        </Sidebar.Collapse>
                    </Sidebar.ItemGroup>
                </Sidebar.Items>
            </div>
        </Sidebar>
    );
}

export default AdminSideBar;