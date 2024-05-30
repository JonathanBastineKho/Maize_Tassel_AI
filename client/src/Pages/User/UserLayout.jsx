import { Outlet } from "react-router-dom";
import UserNavbar from "../../Components/Navbar/UserNavbar";
import UserSideBar from "../../Components/Navbar/UserSidebar";
import UserDrawer from "../../Components/Navbar/UserDrawer";
import { useContext, useEffect, useState } from "react";
import { StorageContext, StorageProvider } from "../../Components/Navbar/StorageContext";

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
      <div className="flex">
        <div className={`hidden md:block ${collapsed ? "md:mr-16" : "md:mr-[16.3rem]"}`}>
          <UserSideBar setCollapsed={setCollapsed} collapsed={collapsed} />
        </div>
        <div className={`w-full flex-grow transition-all duration-100 ease-in-out`}>
          <Outlet />
        </div>
      </div>
      <div className="md:hidden">
        <UserDrawer open={isDrawerOpen} setOpen={setIsDrawerOpen} />
      </div>
    </>
  );
}

export default UserLayout;
