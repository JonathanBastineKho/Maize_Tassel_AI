import { useState, useEffect } from "react";
import { Card, Spinner } from "flowbite-react";
import { useParams } from "react-router-dom";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function ConfirmPage() {
  const [Isloading, setIsLoading] = useState(true);
  const [IsSuccess, setIsSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .patch(`/api/confirm/${token}`)
      .then((res) => {
        if (res.status === 200) {
          setIsSuccess(true);
          setIsLoading(false);
          setTimeout(() => {
            navigate("/");
          }, 2000);
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
    await axios
    .post("/api/request-verification")
    .then((res) => {
        if (res.status === 200){
            setEmailSent(true);
            setTimeout(() => {
                navigate("/");
              }, 2000);
        }
    })
    .catch((err) => {
        console.log(err);
    })
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="text-center sm:w-96 md:w-[28rem]">
        {Isloading && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Confirming your email
            </h1>
            <Spinner size="xl" aria-label="Loading" />
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
              Failed to confirmed email
            </h1>
            {!emailSent && (
              <p className="font-normal text-gray-700 dark:text-gray-400">
                Invalid link or token &nbsp;
                <Link onClick={sendEmail} className="text-green-700 hover:underline">
                  Resend email?
                </Link>
              </p>
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
