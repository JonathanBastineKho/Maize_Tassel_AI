import { FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';

function SuccessSubscriptionPage() {
    const navigate = useNavigate();
    const sessionId = new URLSearchParams(location.search).get('session_id');
    useEffect(() => {
        const timer = setTimeout(() => {
          navigate('/user/subscription');
        }, 4100);
    
        return () => clearTimeout(timer);
      }, [navigate]);

    useEffect(() => {
        const verifySubscription = async () => {
          try {
            const response = await axios.get(`/api/subscription/verify-session?session_id=${sessionId}`);
            if (response.data.status === 'success') {
              console.log('Subscription verified');
            } else {
              // Subscription not verified
              navigate("/");
            }
          } catch (error) {
            navigate("/");
          }
        };
        
        if (sessionId) {
          verifySubscription();
        } else {
            navigate("/");
        }
      }, [sessionId]);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <FaCheckCircle className="mb-6 w-20 h-20 text-green-500" />
            <h2 className="mb-2 text-2xl font-medium text-gray-900 dark:text-white">
                Subscription Successful
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
                You will be redirected to the home page
            </p>
        </div>
    );
}

export default SuccessSubscriptionPage;