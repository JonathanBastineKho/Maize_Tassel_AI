import React, { useState } from "react";
import { Button, Label, TextInput, Spinner, Card } from "flowbite-react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import GoogleLoginButton from "../../Components/Authentication/GoogleLoginButton";
import { inputTheme, spinnerTheme } from "../../Components/theme";
import ToastMsg from "../../Components/Other/ToastMsg";
import { HiExclamation } from "react-icons/hi";
import { format } from "date-fns";

function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [invalidEmailmsg, setInvalidEmailmsg] = useState('');
    const [suspended, setSuspended] = useState(false);
    const [suspensionDuration, setSuspensionDuration] = useState("");
    const [invalidPasswordlmsg, setInvalidPasswordmsg] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const formData = new FormData(e.target);
        const data = {};
        
        formData.forEach((value, key) => {
          data[key] = value;
        });
        await axios.post("/api/auth/login", data)
        .then((res) => {
            if (res.status === 200) {
                setInvalidEmailmsg('');
                setInvalidPasswordmsg('');
                navigate("/");
            }
        })
        .catch((err) => {
          console.log(err.response.status);
            if (err.response.status === 409) {
                setInvalidEmailmsg(err.response.data.detail);
            } else if (err.response.status === 423) {
              setSuspensionDuration(err.response.data.detail);
              setSuspended(true);
            } else {
                setInvalidEmailmsg(err.response.data.detail);
                setInvalidPasswordmsg(err.response.data.detail);
            }
        })
        .then(() => {
            setLoading(false);
        })
        setLoading(false);
      };
      return (
        <div className="flex justify-center items-center h-screen">
        <ToastMsg color="red" icon={<HiExclamation className="h-5 w-5" />} open={suspended} setOpen={setSuspended} 
        message={suspensionDuration.length > 0 ? `You are suspended until ${format(new Date(suspensionDuration), "MMMM d, yyyy")}` : ''}  />
            <Card className="p-4 md:w-[32rem]">
            <h1 className="text-2xl font-semibold mb-4">Sign in to your Account</h1>
        <form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email" value="Your email" />
            </div>
            <TextInput
              theme={inputTheme}
              id="email"
              type="email"
              placeholder="myname@gmail.com"
              required
              name="email"
              shadow
              color={invalidEmailmsg === '' ? "gray" : "failure"}
              helperText={<span className="font-medium">{invalidEmailmsg}</span>}
            />
          </div>
          <div>
            <div className="mb-2 block">
            <Label htmlFor="password" value="Your password" />
            </div>
            <TextInput 
            theme={inputTheme}
            id="password" 
            name="password"
            type="password" 
            required shadow
            color={invalidPasswordlmsg === '' ? "gray" : "failure"}
            helperText={<span className="font-medium">{invalidPasswordlmsg}</span>}
             />
          </div>
          
          <div className="inline-flex items-center justify-center w-full">
            <hr className="w-full h-px my-3 bg-gray-200 border-0 dark:bg-gray-700" />
            <span className="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">
              or
            </span>
          </div>
          <GoogleLoginButton setSuspensionDuration={setSuspensionDuration} setSuspended={setSuspended} setLoading={setLoading} setInvalidEmailmsg={setInvalidEmailmsg} duration={5000} />
          <Button
          type="submit"
          disabled={loading}
          className={`bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
          >
          {loading ? (
            <div className="flex items-center">
              <Spinner aria-label="Spinner button example" size="sm" theme={spinnerTheme} />
              <span className="pl-3">Loading...</span>
            </div>
          ) : (
            'Login'
          )}
        </Button>
        <div className="flex items-center justify-between gap-2">
            <Label htmlFor="agree" className="flex text-gray-800">
                No account? &nbsp;
              <Link to="/register" className="text-green-700 hover:underline">
                Sign up
              </Link>
            </Label>
            <Label htmlFor="agree" className="flex">
              <Link to="/reset-password" className="text-green-700 hover:underline">
                Forgot Password?
              </Link>
            </Label>
          </div>
        </form>
        </Card>
        </div>
      );
}
export default LoginPage;