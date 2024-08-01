import { Outlet } from "react-router-dom";
import UserNavbar from "../../Components/Navbar/UserNavbar";
import UserSideBar from "../../Components/Navbar/UserSidebar";
import UserDrawer from "../../Components/Navbar/UserDrawer";
import { useContext, useEffect, useState } from "react";
import { StorageContext, StorageProvider } from "../../Components/Navbar/StorageContext";
import ToastMsg from "../../Components/Other/ToastMsg";
import { HiExclamation } from "react-icons/hi";

function UserLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <StorageProvider>
      <UserLayoutContent
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />
    </StorageProvider>
  );
}

function UserLayoutContent({ collapsed, setCollapsed, isDrawerOpen, setIsDrawerOpen }) {
  const { getStorage, setStorage } = useContext(StorageContext);
  const [premiumWarning, setPremiumWarning] = useState(false);

  useEffect(() => {
        const fetchStorage = async () => {
            const currentStorage = await getStorage();
            if (currentStorage !== null) {
                setStorage(currentStorage);
            }
        };

        fetchStorage();
    }, [getStorage, setStorage]);

  return (
    <>
      <UserNavbar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onDrawerToggle={() => setIsDrawerOpen(!isDrawerOpen)}
      />
      <ToastMsg color="red" icon={<HiExclamation className="h-5 w-5" />} open={premiumWarning} setOpen={setPremiumWarning} message="Premium feature only" />
      <div className="flex">
        <div className={`hidden md:block ${collapsed ? "md:mr-16" : "md:mr-[16.3rem]"}`}>
          <UserSideBar setPremiumWarning={setPremiumWarning} setCollapsed={setCollapsed} collapsed={collapsed} />
        </div>
        <div className={`w-full flex-grow transition-all duration-100 ease-in-out`}>
          <Outlet />
        </div>
      </div>
      <div className="md:hidden">
        <UserDrawer setPremiumWarning={setPremiumWarning} open={isDrawerOpen} setOpen={setIsDrawerOpen} />
      </div>
    </>
  );
}

export default UserLayout;
