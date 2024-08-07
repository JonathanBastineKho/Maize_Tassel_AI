import React, { useEffect, useState } from "react";
import TransactionChart from "../../Components/Admin/dashboard/TransactionChart";
import TransactionTable from "../../Components/Admin/dashboard/TransactionTable";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import WorkerChart from "../../Components/Admin/dashboard/WorkerChart";
import WorkerTable from "../../Components/Admin/dashboard/WorkerTable";

function AdminDashboardPage() {
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState({});
    const [loading, setLoading] = useState(true);
    const [workerStats, setWorkerStats] = useState([]);
    useEffect(()=>{
        axios.get("/api/subscription/view-transactions")
        .then((res) => {
            if (res.status === 200) {
                setTransaction(res.data);
            }
        })
        .catch((err) => {
            if (err.response.status === 401) {
                navigate("/");
            }
        })
        .finally(()=>{setLoading(false)})
    }, [])

    useEffect(() => {
        const fetchQueueStats = () => {
            axios.get("/api/maintenance/worker-stats")
                .then((res) => {
                    if (res.status === 200) {
                        setWorkerStats(res.data.stats);
                    }
                })
                .catch((err) => {
                    if (err.response.status === 401){
                        navigate("/login");
                    }
                });
        };
        fetchQueueStats();
        const intervalId = setInterval(fetchQueueStats, 5000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="mt-20 p-6">
            <div className="flex flex-col gap-8">
                <TransactionChart loading={loading} transactions={transaction} />
                <TransactionTable loading={loading} transactions={transaction.transactions} />
                <div className="flex flex-col md:flex-row gap-5">
                    <WorkerChart workerStats={workerStats} />
                    <WorkerTable workerStats={workerStats} />
                </div>
            </div>
            
        </div>
    )
}
export default AdminDashboardPage;