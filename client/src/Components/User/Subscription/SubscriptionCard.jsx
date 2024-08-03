import { Button, Card, Label, Spinner, ToggleSwitch } from "flowbite-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { IoCheckmarkCircle } from "react-icons/io5";
import { useContext, useState } from "react";
import { spinnerTheme, toggleSwitchTheme } from "../../theme";
import { AuthContext } from "../../Authentication/AuthContext";
import { useNavigate } from "react-router-dom";

const stripePromise = loadStripe(
  import.meta.env.VITE_REACT_APP_STRIPE_PUBLISHABLE_KEY
);

function SubscriptionCard({ cancelled, lastSub }) {
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);
  const [loadingManage, setLoadingManage] = useState(false);
  const [monthly, setMonthly] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const subscribe = async () => {
    setLoadingSubscribe(true);
    try {
      const response = await axios.post(
        "/api/subscription/create-checkout-session",
        {
          is_monthly: monthly,
        }
      );
      const stripe = await stripePromise;
      const result = await stripe.redirectToCheckout({
        sessionId: response.data.id,
      });
      if (result.error) {
        console.error(result.error.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const manageSub = async () => {
    setLoadingManage(true);
    try {
        const response = await axios.post(
          "/api/subscription/manage-subscription"
        );
        window.location.href = response.data.url;
      } catch (error) {
        if (error.response.status === 401) {
            navigate("/login")
        }
      }
      setLoadingSubscribe(false);
  }

  const features = [
    "Unlimited Storage",
    "Priority Processing",
    "Bulk Upload",
    "Quick count",
    "Tassel count forecast",
    "Folder management",
    "CornSult",
    "Weather forecast",
  ];

  return (
    <Card
      theme={{
        root: {
          base: "flex rounded-lg border border-gray-200 bg-white shadow-sm",
          children: "flex flex-wrap h-full flex-row justify-between gap-4",
        },
      }}
    >
      {user.role === "premium" ? (
        <div className="flex flex-row flex-wrap p-8 justify-between w-full">
          <div className="max-w-[45rem]">
            <h2 className="font-bold text-xl mb-1.5">Subscribed to Premium</h2>
            <span className="text-gray-500">
              Congratulations on subscribing to our premium plan! You now have
              access to a wide range of exclusive features designed to enhance
              your experience and streamline your workflow. Unleash the full
              potential of our cutting-edge technology and take your crop
              analysis to the next level.
            </span>
            <Label className="inline-block mt-3">
              {cancelled
                ? `Your subscription will end on ${new Date(
                    lastSub.end_date
                  ).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}`
                : `Next Payment will be on ${new Date(
                    lastSub.end_date
                  ).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}`}
            </Label>
            <Button
              onClick={manageSub}
              disabled={loadingManage}
              className={`px-5 mt-5 bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
                loadingManage ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {loadingManage ? (
                <div className="flex items-center">
                  <Spinner
                    aria-label="Spinner button example"
                    size="sm"
                    theme={spinnerTheme}
                  />
                  <span className="pl-3">Loading...</span>
                </div>
              ) : (
                "Manage subscription"
              )}
            </Button>
          </div>
          <div className="grid grid-cols-2 mt-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-row gap-2 items-center">
                <IoCheckmarkCircle className="w-5 h-5" color="green" />
                <Label className="text-gray-500">{feature}</Label>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="p-8 flex-grow basis-7/12">
            <div className="flex flex-row justify-between flex-wrap w-full gap-4">
              <div>
                <h2 className="font-bold text-xl mb-1">Premium Plan</h2>
                <span className="text-gray-500">
                  Streamline your crop analysis with our cutting-edge
                  technology.
                </span>
              </div>
              <div className="flex flex-row items-center gap-4">
                <Label className="text-gray-500">Monthly</Label>
                <div>
                  <ToggleSwitch
                    theme={toggleSwitchTheme}
                    color="green"
                    checked={!monthly}
                    onChange={() => {
                      setMonthly(!monthly);
                    }}
                  />
                </div>
                <Label className="text-gray-500">Yearly</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 mt-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-row gap-2 items-center">
                  <IoCheckmarkCircle className="w-5 h-5" color="green" />
                  <Label className="text-gray-500">{feature}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-100 p-6 md:min-w-[27rem] flex flex-col justify-center items-center flex-grow min-h-64">
            <div className="w-full mb-5 text-center">
              <h2 className="text-5xl font-extrabold">
                {monthly ? "$20" : "$150"}
              </h2>
              <span className="text-gray-500">
                per {monthly ? "month" : "year"}
              </span>
            </div>
            <Button
              onClick={subscribe}
              disabled={loadingSubscribe}
              className={`px-12 w-full bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
                loadingSubscribe ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {loadingSubscribe ? (
                <div className="flex items-center">
                  <Spinner
                    aria-label="Spinner button example"
                    size="sm"
                    theme={spinnerTheme}
                  />
                  <span className="pl-3">Loading...</span>
                </div>
              ) : (
                "Subscribe now"
              )}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

export default SubscriptionCard;
