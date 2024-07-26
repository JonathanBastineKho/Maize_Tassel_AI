import { Drawer } from "flowbite-react";
import { Sidebar, Progress } from "flowbite-react";
import { HiChartPie } from "react-icons/hi";
import {
  IoMdImages,
  IoMdPerson,
  IoIosHelpCircle,
  IoMdSettings,
} from "react-icons/io";
import { MdCloudQueue } from "react-icons/md";
import { FaCreditCard } from "react-icons/fa6";
import { LuSettings2 } from "react-icons/lu";
import { progressTheme } from "../theme";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../Authentication/AuthContext";
import { StorageContext } from "./StorageContext";

function UserDrawer({ open, setOpen }) {

  const { user } = useContext(AuthContext);
  const { storage } = useContext(StorageContext);

  return (
    <Drawer open={open} onClose={() => setOpen(false)} className="flex flex-col justify-between">
      <div>
        <Drawer.Header title="MENU" titleIcon={() => <></>} />
        <Drawer.Items className="mt-10">
          <Sidebar
            aria-label="Sidebar with multi-level dropdown example"
            className="[&>div]:bg-transparent [&>div]:p-0 w-full h-full flex flex-col"
          >
            <Sidebar.Items>
              <Sidebar.ItemGroup>
                <Sidebar.Item as={Link} to="/user/dashboard" icon={HiChartPie}>
                  Dashboard
                </Sidebar.Item>
                <Sidebar.Item as={Link} to="/user/images" icon={IoMdImages}>
                  Images
                </Sidebar.Item>
                <Sidebar.Item
                  as={Link}
                  to="/user/subscription"
                  icon={FaCreditCard}
                >
                  Subscription
                </Sidebar.Item>
              </Sidebar.ItemGroup>
              <Sidebar.ItemGroup>
                <Sidebar.Item as={Link} to="/user/profile" icon={IoMdPerson}>Profile</Sidebar.Item>
                <Sidebar.Item as={Link} to="/user/chat" icon={IoIosHelpCircle}>CornSult</Sidebar.Item>
                <Sidebar.Item icon={MdCloudQueue}>
                  Storage {user.role === "regular" ? `(${Math.round(storage / 100 * 100)}% full)` : 'Unlimited'}
                </Sidebar.Item>
                <div className="p-2 flex flex-col gap-5">
                  <div className="flex flex-col gap-2.5">
                    <Progress
                      progress={user.role === "regular" ? storage : 100}
                      className="w-full"
                      size="sm"
                      color="green"
                      theme={progressTheme}
                    />
                    <span className="text-gray-800 text-sm ">
                    {user.role === "regular" ? `${storage} of 100 images used` : `Total of ${storage} images`}
                    </span>
                  </div>
                </div>
              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </Sidebar>
        </Drawer.Items>
      </div>

      <div
        className={`p-2 transition-all duration-100 ease-in-out flex gap-8 justify-center items-center`}
      >
        <button className="hover:bg-gray-100 p-3 rounded-md">
          <IoMdSettings className="w-5 h-5 text-gray-600" />
        </button>
        <button className="hover:bg-gray-100 p-3 rounded-md">
          <LuSettings2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </Drawer>
  );
}

export default UserDrawer;
