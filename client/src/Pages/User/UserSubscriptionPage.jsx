import { useEffect, useState } from "react";
import { Spinner } from "flowbite-react";
import { spinnerTheme } from "../../Components/theme";
import SubscriptionCard from "../../Components/User/Subscription/SubscriptionCard";
import SubscriptionHistoryTable from "../../Components/User/Subscription/SubscriptionHistoryTable";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UserSubscriptionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [cancelled, setCancelled] = useState(false);
  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/subscription/view-subscription")
      .then((res) => {
        if (res.status === 200) {
          setSubscriptions(res.data.transactions);
          setCancelled(res.data.cancelled);
        }
      })
      .catch((err) => {
        if (err.response.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      {loading ? (
        <div className="mt-8 flex items-center justify-center">
          <Spinner className="" theme={spinnerTheme} />
        </div>
      ) : (
        <div className="mt-20 p-6">
          <h2 className="font-bold text-2xl mb-5">Subscription</h2>
          <SubscriptionCard cancelled={cancelled} lastSub={subscriptions[0]} />
          <SubscriptionHistoryTable transactions={subscriptions} />
        </div>
      )}
    </>
  );
}

export default UserSubscriptionPage;
