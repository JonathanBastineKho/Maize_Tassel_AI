import {
  Navbar,
  NavbarBrand,
  Dropdown,
  Avatar,
  DropdownHeader,
  DropdownItem,
  DropdownDivider,
  NavbarCollapse,
  TextInput
} from "flowbite-react";
import { HiSearch, HiMenuAlt1 } from 'react-icons/hi';
import { GoBellFill } from "react-icons/go";
import { BiScan } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../Authentication/AuthContext";
import { inputTheme } from "../theme";
import axios from "axios";

function UserNavbar({collapsed, setCollapsed}) {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const signOut = async () => {
    await axios.post("/api/auth/logout")
    .then((res) => {
        if (res.status === 200){
            setUser(null);
            navigate("/");
        }
    })
    .catch((error) => {})
}

  return (
    <Navbar className="border p-3.5 fixed top-0 left-0 right-0 z-50" fluid>
    <div className="flex flex-row justify-between gap-16">
        <div className="flex gap-4">
            <button className="px-2 hover:bg-gray-100 rounded-md" onClick={()=>{setCollapsed(!collapsed)}}>
                <HiMenuAlt1 className="w-6 h-6 text-gray-900"/>
            </button>
            <NavbarBrand as={Link} to="/">
                <img
                src="https://storage.googleapis.com/corn_sight_public/apple-touch-icon.png"
                className="mr-3 h-6 sm:h-9"
                alt="logo"
                />
                <span className="self-center whitespace-nowrap text-xl font-bold text-gray-800">
                CornSight
                </span>
            </NavbarBrand>
            
        </div>
        
        <NavbarCollapse>
            <TextInput className="w-96" placeholder="Search" icon={HiSearch} theme={inputTheme}/>
        </NavbarCollapse>
    </div>
      
      <div className="flex md:order-2 gap-4">
        <div className="flex">
            <button className="px-2 hover:bg-gray-100 rounded-md">
                <GoBellFill className="w-5 h-5 text-gray-600 hover:text-gray-800"/>
            </button>
            <button className="px-2 hover:bg-gray-100 rounded-md">
                <BiScan className="w-5 h-5 text-gray-600 hover:text-gray-800"/>
            </button>
        </div>
        
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <Avatar
              alt="User settings"
              img="https://storage.googleapis.com/corn_sight_public/profile.jpg"
              rounded
            />
          }
        >
          <DropdownHeader>
            <span className="block text-sm">{user.name}</span>
            <span className="block truncate text-sm font-medium">
              {user?.email}
            </span>
          </DropdownHeader>
          <DropdownItem as={Link} to="/user/dashboard">
            Dashboard
          </DropdownItem>
          <DropdownItem>Settings</DropdownItem>
          <DropdownDivider />
          <DropdownItem onClick={signOut}>Sign out</DropdownItem>
        </Dropdown>
      </div>
    </Navbar>
  );
}

export default UserNavbar;
