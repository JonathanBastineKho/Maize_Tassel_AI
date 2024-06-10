import React, { useState } from "react";
import {
  Button,
  Checkbox,
  Label,
  TextInput,
  Spinner,
  Card,
} from "flowbite-react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import GoogleLoginButton from "../../Components/Authentication/GoogleLoginButton";
import ToastMsg from "../../Components/Other/ToastMsg";
import { HiExclamation } from "react-icons/hi";
import { inputTheme, checkBoxTheme } from "../../Components/theme";
import { format } from "date-fns";

function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [invalidEmailmsg, setInvalidEmailmsg] = useState("");
  const [suspended, setSuspended] = useState(false);
  const [suspensionDuration, setSuspensionDuration] = useState("");
  const [invalidPasswordmsg, setInvalidPasswordmsg] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });
    // Check if password minimum 8 characters
    if (data.password.length < 8){
      setInvalidPasswordmsg("Password must be atleast 8 characters");
    } else {
      await axios
      .post("/api/auth/register", data)
      .then((res) => {
        if (res.status === 200) {
          setInvalidEmailmsg("");
          navigate("/unverified");
        }
      })
      .catch((err) => {
        setInvalidEmailmsg(err.response.data.detail);
      })
      .then(() => {
        setLoading(false);
      });
    }
    setLoading(false);
  };
  return (
    <div className="flex justify-center items-center h-screen">
      <ToastMsg color="red" icon={<HiExclamation className="h-5 w-5" />} open={suspended} setOpen={setSuspended} 
      message={suspensionDuration.length > 0 ? `You are suspended until ${format(new Date(suspensionDuration), "MMMM d, yyyy")}` : ''} duration={5000} />
      <Card className="p-4 md:w-[32rem]">
        <h1 className="text-2xl font-semibold mb-4">Create New Account</h1>
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email2" value="Your email" />
            </div>
            <TextInput
              id="email"
              type="email"
              placeholder="myemail@gmail.com"
              required
              name="email"
              shadow
              theme={inputTheme}
              color={invalidEmailmsg === "" ? "gray" : "failure"}
              helperText={
                <span className="font-medium">{invalidEmailmsg}</span>
              }
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="name2" value="Your Name" />
            </div>
            <TextInput
              id="name"
              type="text"
              placeholder="John Doe"
              required
              name="name"
              shadow
              theme={inputTheme}
              helperText={
                <span className="font-medium"></span>
              }
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="password2" value="Your password" />
            </div>
            <TextInput
              id="password"
              name="password"
              type="password"
              required
              shadow
              theme={inputTheme}
              color={invalidPasswordmsg === "" ? "gray" : "failure"}
              helperText={
                <span className="font-medium">{invalidPasswordmsg}</span>
              }
            />
          </div>
          <div className="inline-flex items-center justify-center w-full my-1">
            <hr className="w-full h-px my-3 bg-gray-200 border-0 dark:bg-gray-700" />
            <span className="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">
              or
            </span>
          </div>
          <div className="flex flex-col gap-4">
          <GoogleLoginButton
            setSuspensionDuration={setSuspensionDuration}
            setSuspended={setSuspended}
            setLoading={setLoading}
            setInvalidEmailmsg={setInvalidEmailmsg}
          />
          <div className="flex items-center gap-2">
            <Checkbox id="agree" required theme={checkBoxTheme} />
            <Label htmlFor="agree" className="flex">
              I agree with the&nbsp;
              <Link to="/" className="text-green-700 hover:underline">
                terms and conditions
              </Link>
            </Label>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className={`bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
              loading ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <Spinner aria-label="Spinner button example" size="sm" />
                <span className="pl-3">Loading...</span>
              </div>
            ) : (
              "Register new account"
            )}
          </Button>
          <Label htmlFor="agree" className="flex">
            Already have an account? &nbsp;
            <Link to="/login" className="text-green-700 hover:underline">
              Sign in
            </Link>
          </Label>
          </div>
          
        </form>
      </Card>
    </div>
  );
}
export default RegisterPage;
