import { Outlet } from "react-router-dom";
import NavigationBar from "../../Components/Navbar/Navbar";

function PublicLayout() {
    return (
        <div>
            <NavigationBar />
            <main>
                <Outlet />
            </main>
        </div>
    );
}

export default PublicLayout;