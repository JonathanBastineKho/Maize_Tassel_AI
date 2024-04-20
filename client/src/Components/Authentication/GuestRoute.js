import { AuthContext } from "./AuthContext";
import { useContext, useState, useEffect } from "react";
import { Spinner } from "flowbite-react";
import axios from "axios";
import { Navigate } from "react-router-dom";

const GuestRoot = ({ children }) => {
    const { user, setUser } = useContext(AuthContext);
    const [isValidated, setIsValidated] = useState(false);

    useEffect(() => {
        axios.get("/api/whoami")
        .then((res) => {
            if (res.status === 200) {
                // User is 
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
    if (!isValidated){
        return (
            <div className="text-center text-8xl">
                <Spinner aria-label="Extra large spinner example" size="xl" />
            </div>
        );
    }
    if (user != null) {
        if (user.verified){
            return <Navigate to="/" />
        } else {
            return <Navigate to="/unverified" />
        }
    } else {
        return children
    }
}

export default GuestRoot;