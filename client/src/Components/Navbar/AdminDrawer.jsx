import { Drawer, Sidebar } from "flowbite-react";
import { sidebarTheme } from "../theme";
import { Link } from "react-router-dom";
import { HiChartPie } from "react-icons/hi";
import { IoMdPeople } from "react-icons/io";
import { BsStars } from "react-icons/bs";

function AdminDrawer({ open, setOpen }){
    return (
        <Drawer 
            theme={{
                root: {
                    base: "fixed z-40 overflow-y-auto bg-white py-4 px-1 transition-transform"
                }
            }}
        open={open} onClose={()=>{setOpen(false)}}>
            <Sidebar theme={{
                root: {
                    inner: "h-full overflow-y-auto overflow-x-hidden rounded px-3 py-4"
                }
            }} className="z-40 h-full flex flex-col">
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
        </Drawer>
    );
}

export default AdminDrawer;