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
    const [activeSection, setActiveSection] = useState("home");
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
      const handleScroll = () => {
        const scrollTop = window.scrollY;
        setIsScrolled(scrollTop > 50);
      };

      window.addEventListener("scroll", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);

    useEffect(() => {
      const handleScroll = () => {
        const sections = ["home", "features", "pricing", "getting-started"];
        const scrollPosition = window.scrollY;
  
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = document.getElementById(sections[i]);
          if (section && scrollPosition >= section.offsetTop - 100) {
            setActiveSection(sections[i]);
            break;
          }
        }
      };
  
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);
    
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
      <Navbar fluid  theme={navbarTheme} className={`p-3.5 sticky top-0 z-50 transition duration-400 ease-in-out ${
        isScrolled ? "shadow-lg shadow-gray-200/20" : ""
      }`}>
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
                            src={`${user.profile_pict}?${Date.now()}`}
                            alt={avatarProps.alt}
                          />
                        )}
                        rounded
                      />}
                >
                    <DropdownHeader>
                        <span className="block text-sm font-medium">{user.name}</span>
                        <span className="block truncate text-sm mb-2">{user?.email}</span>
                        <span className="block text-sm text-gray-500">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                    </DropdownHeader>
                    <DropdownItem as={Link} to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}>Dashboard</DropdownItem>
                    {user.role === 'admin' ? (
                    <DropdownItem as={Link} to="/admin/images" >Images</DropdownItem>
                    ) : (
                    <DropdownItem as={Link} to="/user/profile">Profile</DropdownItem>
                    )}
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
          <NavbarLink href="#home"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#home").scrollIntoView({
                behavior: "smooth",
              });
            }}
            active={activeSection === "home"} >
            Home
          </NavbarLink>
          <NavbarLink href="#features"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#features").scrollIntoView({
                behavior: "smooth",
              });
            }}
            active={activeSection === "features"}>Features</NavbarLink>
          <NavbarLink href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#pricing").scrollIntoView({
                behavior: "smooth",
              });
            }}
            active={activeSection === "pricing"}>Pricing</NavbarLink>
          <NavbarLink href="#getting-started"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#getting-started").scrollIntoView({
                behavior: "smooth",
              });
            }}
            active={activeSection === "getting-started"}>Getting Started</NavbarLink>
          {/* <NavbarLink href="#">Contact</NavbarLink> */}
        </NavbarCollapse>
      </Navbar>
    );
  }
  