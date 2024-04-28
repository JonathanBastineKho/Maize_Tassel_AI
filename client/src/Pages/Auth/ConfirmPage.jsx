import { useState, useEffect } from "react";
import { Card, Spinner, Button } from "flowbite-react";
import { useParams } from "react-router-dom";
import { useNavigate} from "react-router-dom";
import axios from "axios";

import { spinnerTheme } from "../../Components/theme";

function ConfirmPage() {
  const [Isloading, setIsLoading] = useState(true);
  const [emailSentLoading, setEmailSentLoading] = useState(false);
  const [IsSuccess, setIsSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .patch(`/api/auth/confirm/${token}`)
      .then((res) => {
        if (res.status === 200) {
          setIsSuccess(true);
          setIsLoading(false);
          setTimeout(() => {
            navigate("/");
          }, 3000);
        }
      })
      .catch((err) => {
        setIsSuccess(false);
      })
      .then(() => {
        setIsLoading(false);
      });
  }, [navigate, token]);

  const sendEmail = async () => {
    setEmailSentLoading(true);
    await axios
      .post("/api/auth/request-verification")
      .then((res) => {
        if (res.status === 200) {
          setEmailSent(true);
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      })
      .catch((err) => {
        console.log(err);
      });
      setEmailSentLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="p-4 text-center sm:w-96 md:w-[28rem]">
        <img className="w-28 mx-auto block my-1" src="https://storage.googleapis.com/corn_sight_public/mail.png" alt="Mail logo" />
        {Isloading && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Confirming your email
            </h1>
            <Spinner size="xl" aria-label="Loading" theme={spinnerTheme} />
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Loading
            </p>
          </>
        )}
        {!Isloading && IsSuccess && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Email Confirmed Successfully
            </h1>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              You will be redirected to the home page
            </p>
          </>
        )}
        {!Isloading && !IsSuccess && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Email verification link expired
            </h1>
            {!emailSent && (
              <>
                <p className="font-normal text-gray-700">
                  Looks like the verification link has expired. Not to worry, we
                  can send the link again.
                </p>
                <Button
                  onClick={sendEmail}
                  disabled={emailSentLoading}
                  className={`bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
                    emailSentLoading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {emailSentLoading ? (
                    <div className="flex items-center">
                      <Spinner aria-label="Spinner button example" size="sm" />
                      <span className="pl-3">Loading...</span>
                    </div>
                  ) : (
                    "Resend verification link"
                  )}
                </Button>
              </>
            )}
            {emailSent && (
              <p className="font-normal text-gray-700 dark:text-gray-400">
                Email successfully sent
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

export default ConfirmPage;
