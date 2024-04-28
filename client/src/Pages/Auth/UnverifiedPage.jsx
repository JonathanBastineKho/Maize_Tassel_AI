import { useState, useContext } from "react";
import { Card, Spinner, Button } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../Components/Authentication/AuthContext";

function UnverifiedPage() {
  const [emailSentLoading, setEmailSentLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

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
        <img
          className="w-28 mx-auto block my-1"
          src="https://storage.googleapis.com/corn_sight_public/mail.png"
          alt="Mail logo"
        />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Please verify your email
        </h1>
        {!emailSent && (
          <>
            <p className="font-normal text-gray-500">
              You're almost there! We sent an email to <span className="font-semibold text-gray-700">{user.email}</span>
            </p>
            <p className="font-normal text-gray-500">
              Just click on the link in that email to complete your signup. If you don't see it, you may need to <span className="font-semibold text-gray-700">check your spam</span> folder.
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
      </Card>
    </div>
  );
}

export default UnverifiedPage;
