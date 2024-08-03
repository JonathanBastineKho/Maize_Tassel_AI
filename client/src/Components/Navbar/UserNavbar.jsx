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
import { HiSearch, HiMenuAlt1, HiChartPie } from 'react-icons/hi';
import { IoMdImages, IoMdPerson, IoIosHelpCircle } from 'react-icons/io';
import { FaCreditCard } from 'react-icons/fa';
import { PiClockCountdownBold } from 'react-icons/pi';
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../Authentication/AuthContext";
import { inputTheme } from "../theme";
import axios from "axios";

function UserNavbar({collapsed, setCollapsed, onDrawerToggle}) {
  const { user, setUser } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);
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
  const menuItems = [
    { name: 'Dashboard', icon: HiChartPie, path: '/user/dashboard' },
    { name: 'Images', icon: IoMdImages, path: '/user/images' },
    { name: 'Subscription', icon: FaCreditCard, path: '/user/subscription' },
    { name: 'Profile', icon: IoMdPerson, path: '/user/profile' },
    { name: 'CornSult', icon: IoIosHelpCircle, path: '/user/chat' },
    { name: 'Quick Count', icon: PiClockCountdownBold, path: '/user/quick-count' },
  ];

  useEffect(() => {
    if (searchTerm) {
      const filteredResults = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filteredResults);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchTerm('');
        setSearchResults([]);
      }
    }
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Navbar className="border p-3.5 fixed top-0 left-0 right-0 z-50" fluid>
    <div className="flex flex-row justify-between gap-16">
        <div className="flex gap-4">
            <button
              className="p-2 hover:bg-gray-100 rounded-md md:hidden"
              onClick={onDrawerToggle}
            >
              <HiMenuAlt1 className="w-6 h-6 text-gray-900" />
            </button>
            <button className="px-2 hover:bg-gray-100 rounded-md hidden md:block" onClick={()=>{setCollapsed(!collapsed)}}>
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
          <div className="relative" ref={searchRef}>
              <TextInput
                className="w-96"
                placeholder="Search"
                icon={HiSearch}
                theme={inputTheme}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {searchResults.map((item, index) => (
                    <Link
                      key={index}
                      to={item.path}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => {
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      <item.icon className="mr-2 text-gray-500 w-5 h-5" />
                      <span className="text-gray-700"> {item.name} </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
        </NavbarCollapse>
    </div>
      
      <div className="flex md:order-2 gap-3">
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <Avatar
              alt="User settings"
              img={(avatarProps) => (
                <img
                  {...avatarProps}
                  referrerPolicy="no-referrer"
                  src={`${user.profile_pict}?${Date.now()}`}
                  alt={avatarProps.alt}
                />
              )}
              rounded
            />
          }
        >
          <DropdownHeader>
            <span className="block text-sm font-medium">{user.name}</span>
            <span className="block truncate text-sm mb-2">{user?.email}</span>
            <span className="block text-sm text-gray-500">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
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
