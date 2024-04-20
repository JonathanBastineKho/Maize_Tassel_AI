import { Card, Label, TextInput, Button, Spinner } from "flowbite-react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ResetPasswordPage() {
  const [Isloading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invalidEmailmsg, setInvalidEmailmsg] = useState("");
  const navigate = useNavigate();

  const submitReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    await axios
      .post("/api/reset-password/request", data)
      .then((res) => {
        if (res.status === 200) {
          setIsSuccess(true);
          setTimeout(() => {
            navigate("/");
          }, 3000);
        }
      })
      .catch((err) => {
        setInvalidEmailmsg(err.response.data.detail);
      });
    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="sm:w-96 md:w-[32rem] p-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Reset Your Password
          </h1>
          {Isloading &&
            <div className="text-center">
                <Spinner size="xl" aria-label="Loading" />
            </div>
          }
          {isSuccess && !Isloading &&
            <Label className="text-center font-normal text-gray-700 dark:text-gray-400">
                Check your email for reset password link
            </Label>
          }
          {!isSuccess && !Isloading && (
            <>
              <Label className="font-normal text-gray-700 dark:text-gray-400">
                Don't fret! Just type in your email and we will send you a code
                to reset your password!
              </Label>
              <form
                className="flex max-w-md flex-col gap-4 mt-4"
                onSubmit={submitReset}
              >
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="email1" value="Your email" />
                  </div>
                  <TextInput
                    id="email1"
                    type="email"
                    name="email"
                    placeholder="mymail@gmail.com"
                    required
                  />
                  {invalidEmailmsg !== "" && (
                  <div
                    id="emailError"
                    className="text-red-500 text-sm mt-1"
                  >
                    {invalidEmailmsg}
                  </div>
                )}
                </div>
                <Button type="submit" className="bg-green-600">Submit</Button>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
