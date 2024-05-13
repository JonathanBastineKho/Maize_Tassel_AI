import { Sidebar, Progress } from "flowbite-react";
import { sidebarTheme } from "../theme";
import { HiChartPie } from "react-icons/hi";
import { IoMdImages, IoMdPerson, IoIosHelpCircle, IoMdSettings } from "react-icons/io";
import { MdCloudQueue } from "react-icons/md";
import { FaCreditCard } from "react-icons/fa6";
import { LuSettings2 } from "react-icons/lu";
import { progressTheme } from "../theme";
import { Link } from "react-router-dom";


function UserSideBar() {
    return (
        <Sidebar theme={sidebarTheme} className="z-40">
            <div className="flex flex-col justify-between h-full">
                <Sidebar.Items>
                    <Sidebar.ItemGroup>
                        <Sidebar.Item as={Link} to="/user/dashboard" icon={HiChartPie}>
                            Dashboard
                        </Sidebar.Item>
                        <Sidebar.Item as={Link} to="/user/images" icon={IoMdImages}>
                            Images
                        </Sidebar.Item>
                        <Sidebar.Item icon={FaCreditCard}>
                            Subscription
                        </Sidebar.Item>
                    </Sidebar.ItemGroup>
                    <Sidebar.ItemGroup>
                        <Sidebar.Item icon={IoMdPerson}>
                            Profile
                        </Sidebar.Item>
                        <Sidebar.Item icon={IoIosHelpCircle}>
                            Help
                        </Sidebar.Item>
                        <div className="p-2 flex flex-col gap-5">
                            <div className="flex gap-3">
                                <MdCloudQueue className="w-6 h-6 text-gray-600" />
                                Storage (75% full)
                            </div>
                            <div className="flex flex-col gap-2.5">
                                <Progress progress={75} className="w-48" size="sm" color="green" theme={progressTheme}/>
                                <span className="text-gray-800 text-sm">75 of 100 images used</span>
                            </div>
                        </div>
                        
                    </Sidebar.ItemGroup>
                </Sidebar.Items>
                <div className="p-2 flex gap-8 justify-center items-center">
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

export default UserSideBar;