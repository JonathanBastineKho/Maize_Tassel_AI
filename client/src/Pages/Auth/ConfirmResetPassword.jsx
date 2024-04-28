import { Card, Label, TextInput, Button, Spinner } from "flowbite-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { inputTheme, spinnerTheme } from "../../Components/theme";

function ConfirmResetPasswordPage() {
  const [IsPageLoading, setIsPageLoading] = useState(true);
  const [Isloading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [passwordErr, setPasswordErr] = useState('');
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    axios
      .get(`/api/auth/reset-password/check/${token}`)
      .then((res) => {
        if (res.status === 200) {
          setIsPageLoading(false);
        }
      })
      .catch((err) => {
        navigate("/");
      });
  }, []);

  const submitReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    // Check password and retype password
    if (data.password !== data.repassword){
      setPasswordErr("Please make sure password match");
    // Check if password is atleast 8 characters
    } else if (data.password.length < 8) {
      setPasswordErr("Password must be atleast 8 characters");
    } else {
      // Submission
      await axios
      .patch(`/api/auth/reset-password/confirm/${token}`, data)
      .then((res) => {
        if (res.status === 200) {
          setIsSuccess(true);
          setTimeout(() => {
            navigate("/");
          }, 3000);
        }
      })
      .catch((err) => {
        setIsValidated(true);
        setTimeout(() => {
          navigate("/");
        }, 3000);
      });
    }
    setIsLoading(false);
  };
  if (IsPageLoading) {
    return (
      <div className="text-center text-8xl">
        <Spinner aria-label="Extra large spinner example" size="xl" />
      </div>
    );
  }
  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="sm:w-96 md:w-[32rem] p-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Change your password
          </h1>
          {isSuccess && !Isloading && (
            <Label className="text-center font-normal text-gray-700 dark:text-gray-400">
              Password Successfully Changed
            </Label>
          )}
          {!isSuccess && isValidated && (
            <Label className="text-center font-normal text-gray-700 dark:text-gray-400">
              Password has been expired
            </Label>
          )}
          {!isSuccess && !isValidated && (
            <>
              <Label className="font-normal text-gray-700 dark:text-gray-400">
                Enter your new password in this form. Please don't forget your
                new password
              </Label>
              <form
                className="flex max-w-md flex-col gap-4 mt-4"
                onSubmit={submitReset}
              >
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="password" value="Your new password" />
                  </div>
                  <TextInput
                    id="password"
                    type="password"
                    name="password"
                    placeholder=""
                    required
                    theme={inputTheme}
                    color={passwordErr === '' ? "gray" : "failure"}
                    helperText={<span className="font-medium">{passwordErr}</span>}
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="repassword" value="Retype password" />
                  </div>
                  <TextInput
                    id="repassword"
                    type="password"
                    name="repassword"
                    placeholder=""
                    required
                    theme={inputTheme}
                    color={passwordErr === '' ? "gray" : "failure"}
                    helperText={<span className="font-medium">{passwordErr}</span>}
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
                    "Change Password"
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

export default ConfirmResetPasswordPage;
