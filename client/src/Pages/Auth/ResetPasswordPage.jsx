import { Card, Label, TextInput, Button, Spinner } from "flowbite-react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { inputTheme, spinnerTheme } from "../../Components/theme";

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
      .post("/api/auth/reset-password/request", data)
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
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Reset Your Password
          </h1>
          {isSuccess && !Isloading && (
            <Label className="text-center font-normal text-gray-700 dark:text-gray-400">
              Check your email for reset password link
            </Label>
          )}
          {!isSuccess && (
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
                    theme={inputTheme}
                    color={invalidEmailmsg === "" ? "gray" : "failure"}
                    helperText={
                      <span className="font-medium">{invalidEmailmsg}</span>
                    }
                  />
                </div>
                <Button
                  type="submit"
                  disabled={Isloading}
                  className={`bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
                    Isloading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {Isloading ? (
                    <div className="flex items-center">
                      <Spinner
                        aria-label="Spinner button example"
                        size="sm"
                        theme={spinnerTheme}
                      />
                      <span className="pl-3">Loading...</span>
                    </div>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
