import React, { useState } from "react";
import { Button, Label, TextInput, Spinner, Card } from "flowbite-react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import GoogleLoginButton from "../../Components/Authentication/GoogleLoginButton";

function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [invalidEmailmsg, setInvalidEmailmsg] = useState('');
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
        await axios.post("/api/login", data)
        .then((res) => {
            if (res.status === 200) {
                setInvalidEmailmsg('');
                setInvalidPasswordmsg('');
                navigate("/");
            }
        })
        .catch((err) => {
            if (err.response.status === 409) {
                setInvalidEmailmsg(err.response.data.detail);
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
            <Card className="p-4 md:w-[32rem]">
            <h1 className="text-2xl font-semibold mb-4">Sign in to your Account</h1>
            <form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email2" value="Your email" />
            </div>
            <TextInput
              id="email2"
              type="email"
              placeholder="myname@gmail.com"
              required
              name="email"
              shadow
            />
            {invalidEmailmsg !== '' && <div id="passwordError" className="text-red-500 text-sm mt-1">
                {invalidEmailmsg}
            </div>}
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="password2" value="Your password" />
            </div>
            <TextInput id="password2" name="password" type="password" required shadow />
            {invalidPasswordlmsg !== '' && <div id="passwordError" className="text-red-500 text-sm mt-1">
                {invalidPasswordlmsg}
            </div>}
          </div>
          
          <div className="inline-flex items-center justify-center w-full">
            <hr className="w-full h-px my-4 bg-gray-200 border-0 dark:bg-gray-700" />
            <span className="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">
              or
            </span>
          </div>
          <GoogleLoginButton setLoading={setLoading} setInvalidEmailmsg={setInvalidEmailmsg} />
          <Button
          type="submit"
          disabled={loading}
          className={`bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {loading ? (
            <div className="flex items-center">
              <Spinner aria-label="Spinner button example" size="sm" />
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