import React, { useState } from "react";
import { Button, Checkbox, Label, TextInput, Spinner, Card } from "flowbite-react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

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
          <Button className="border border-gray-300 bg-white focus:ring-4 focus:ring-green-300 enabled:hover:bg-gray-200 text-gray-800 flex items-center justify-center">
            <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 4.63C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-4.63C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-4.62c-.49-1.45-.77-2.99-.77-4.59z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 4.63C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span className="ml-3">Continue with Google</span>
            </div>
           </Button>
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