import React, { useState } from "react";
import { Button, Checkbox, Label, TextInput, Spinner, Card } from "flowbite-react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import GoogleLoginButton from "../../Components/Authentication/GoogleLoginButton";

function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const [invalidEmailmsg, setInvalidEmailmsg] = useState('');
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const formData = new FormData(e.target);
        const data = {};
        
        formData.forEach((value, key) => {
          data[key] = value;
        });
        
        await axios.post("/api/register", data)
        .then((res) => {
            if (res.status === 200) {
                setInvalidEmailmsg('');
                navigate("/");
            }
        })
        .catch((err) => {
            setInvalidEmailmsg(err.response.data.detail);
        })
        .then(() => {
            setLoading(false);
        })
        setLoading(false);
      };
      return (
        <div className="flex justify-center items-center h-screen">
            <Card className="p-4 md:w-[32rem]">
            <h1 className="text-2xl font-semibold mb-4">Create New Account</h1>
            <form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email2" value="Your email" />
            </div>
            <TextInput
              id="email2"
              type="email"
              placeholder="myemail@gmail.com"
              required
              name="email"
              shadow
            />
            {invalidEmailmsg !== '' && <div id="invalidEmail" className="text-red-500 text-sm mt-1">
                {invalidEmailmsg}
            </div>}
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="name2" value="Your Name" />
            </div>
            <TextInput
              id="name2"
              type="text"
              placeholder="John Doe"
              required
              name="name"
              shadow
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="password2" value="Your password" />
            </div>
            <TextInput id="password2" name="password" type="password" required shadow />
          </div>
          <div className="inline-flex items-center justify-center w-full">
            <hr className="w-full h-px my-4 bg-gray-200 border-0 dark:bg-gray-700" />
            <span className="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">
              or
            </span>
          </div>
          <GoogleLoginButton setLoading={setLoading} setInvalidEmailmsg={setInvalidEmailmsg} />
          <div className="flex items-center gap-2">
            <Checkbox id="agree" required/>
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
          className={`bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {loading ? (
            <div className="flex items-center">
              <Spinner aria-label="Spinner button example" size="sm" />
              <span className="pl-3">Loading...</span>
            </div>
          ) : (
            'Register new account'
          )}
        </Button>
            <Label htmlFor="agree" className="flex">
                Already have an account? &nbsp;
              <Link to="/login" className="text-green-700 hover:underline">
                Sign in
              </Link>
            </Label>
        </form>
        </Card>
        </div>
      );
}
export default RegisterPage;