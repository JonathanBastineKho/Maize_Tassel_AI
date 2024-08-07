import { Drawer } from "flowbite-react";
import { Sidebar, Progress } from "flowbite-react";
import { HiChartPie } from "react-icons/hi";
import {
  IoMdImages,
  IoMdPerson,
  IoIosHelpCircle,
} from "react-icons/io";
import { PiClockCountdownBold } from "react-icons/pi";
import { MdCloudQueue } from "react-icons/md";
import { FaCreditCard } from "react-icons/fa6";
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
                <Sidebar.Item as={Link} to="/user/quick-count" icon={PiClockCountdownBold}>
                  Quick Count
                </Sidebar.Item>
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
    </Drawer>
  );
}

export default UserDrawer;
