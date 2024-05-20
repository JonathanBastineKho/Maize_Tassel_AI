import {
    Avatar,
    Dropdown,
    DropdownDivider,
    DropdownHeader,
    DropdownItem,
    Navbar,
    NavbarBrand,
    NavbarCollapse,
    NavbarLink,
    NavbarToggle,
    Button,
    Spinner
  } from "flowbite-react";
  
  import { AuthContext } from "../Authentication/AuthContext";
  import { navbarTheme } from "../theme";
  import { useContext, useState, useEffect } from "react";
  import { Link } from "react-router-dom";
  import { spinnerTheme } from "../theme";
  import axios from "axios";


  export default function NavigationBar() {
    const { user, setUser } = useContext(AuthContext);
    const [isValidated, setIsValidated] = useState(false);
    
    const signOut = async () => {
        setIsValidated(false);
        await axios.post("/api/auth/logout")
        .then((res) => {
            if (res.status === 200){
                setUser(null);
            }
        })
        .catch((error) => {})
        .then(() => setIsValidated(true));
    }

    useEffect(() => {
        axios.get("/api/auth/whoami")
        .then((res) => {
            if (res.status === 200) {
                // User is authenticated
                setUser(res.data);
            } else {
                // User is not logged in
                setUser(null);
            }
        })
        .catch((error) => {
            setUser(null);
        })
        .then(() => setIsValidated(true));
    }, [setUser]);
    return (
      <Navbar fluid  theme={navbarTheme} className="p-3.5 fixed top-0 left-0 right-0 z-50 shadow-lg shadow-gray-200/20">
        <NavbarBrand as={Link} to="/">
          <img src="https://storage.googleapis.com/corn_sight_public/apple-touch-icon.png" className="mr-3 h-6 sm:h-9" alt="logo" />
          <span className="self-center whitespace-nowrap text-xl font-bold text-gray-800">CornSight</span>
        </NavbarBrand>
        <div className="flex md:order-2">
            {user != null && isValidated && <><Dropdown
                    arrowIcon={false}
                    inline
                    label={<Avatar
                        alt="User settings"
                        img={(avatarProps) => (
                          <img
                            {...avatarProps}
                            referrerPolicy="no-referrer"
                            src={user.profile_pict}
                            alt={avatarProps.alt}
                          />
                        )}
                        rounded
                      />}
                >
                    <DropdownHeader>
                        <span className="block text-sm">{user.name}</span>
                        <span className="block truncate text-sm font-medium">{user?.email}</span>
                    </DropdownHeader>
                    <DropdownItem as={Link} to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}>Dashboard</DropdownItem>
                    <DropdownItem>Settings</DropdownItem>
                    <DropdownDivider />
                    <DropdownItem onClick={signOut}>Sign out</DropdownItem>
                </Dropdown><NavbarToggle /></>
            }
            {user === null && isValidated &&
            <div className="flex justify-between gap-4">
                <Link to="/login">
                    <Button className="bg-green-600 bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800">Login</Button>
                </Link>
                <Link to="/register">
                    <Button color="light">Sign Up</Button>
                </Link>
            </div>}
            {!isValidated && 
            <Spinner theme={spinnerTheme} aria-label="Loading" />}
          
        </div>
        <NavbarCollapse>
          <NavbarLink href="#" active >
            Home
          </NavbarLink>
          <NavbarLink href="#">About</NavbarLink>
          <NavbarLink href="#">Features</NavbarLink>
          <NavbarLink href="#">Pricing</NavbarLink>
          <NavbarLink href="#">Contact</NavbarLink>
        </NavbarCollapse>
      </Navbar>
    );
  }
  