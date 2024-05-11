import { AuthContext } from "./AuthContext";
import { useContext, useState, useEffect } from "react";
import { Spinner } from "flowbite-react";
import axios from "axios";
import { Navigate, useLocation } from "react-router-dom";
import { spinnerTheme } from "../theme";

const PrivateRoute = ({ requiredRoles, verified, children }) => {
    const { user, setUser } = useContext(AuthContext);
    const [isValidated, setIsValidated] = useState(false);
    const location = useLocation();

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
    }, [setUser, location.pathname]);
    if (!isValidated){
        return (
            <div className="text-center text-8xl">
                <Spinner aria-label="Extra large spinner example" size="xl" theme={spinnerTheme} />
            </div>
        );
    }
    if (user != null) {
        if (requiredRoles.includes(user.role)){
            if (verified && !user.verified){
                return <Navigate to="/unverified" />
            } else if (!verified && user.verified){
                return <Navigate to="/" />
            } else {
                return children
            }
        } else {
            return <Navigate to="/" />
        }
    } else {
        return <Navigate to="/login" />
    }
}

export default PrivateRoute;