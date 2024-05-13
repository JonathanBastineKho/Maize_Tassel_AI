import { Outlet } from "react-router-dom";
import UserNavbar from "../../Components/Navbar/UserNavbar";
import UserSideBar from "../../Components/Navbar/UserSidebar";

function UserLayout() {
    return (
        <>
            <UserNavbar />
            <div className="flex">
                <UserSideBar />
                <Outlet />
            </div>
        </>
    );
}

export default UserLayout;