import { Card, Label, TextInput, Button, Spinner } from "flowbite-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function ConfirmResetPasswordPage() {
  const [IsPageLoading, setIsPageLoading] = useState(true);
  const [Isloading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    axios.get(`/api/reset-password/check/${token}`)
    .then((res) => {
        if (res.status === 200) {
            setIsPageLoading(false);
        }
    })
    .catch((err) => {
        navigate("/");
    })
  }, []);

  const submitReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);
    const data = {};
    console.log(data);
    formData.forEach((value, key) => {
      data[key] = value;
    });
    await axios
      .patch(`/api/reset-password/confirm/${token}`, data)
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
      });
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
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Change your password
          </h1>
          {Isloading && (
            <div className="text-center">
              <Spinner size="xl" aria-label="Loading" />
            </div>
          )}
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
          {!isSuccess && !Isloading && (
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
                    <Label htmlFor="email1" value="Your new password" />
                  </div>
                  <TextInput
                    id="email1"
                    type="password"
                    name="password"
                    placeholder=""
                    required
                  />
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

export default ConfirmResetPasswordPage;
