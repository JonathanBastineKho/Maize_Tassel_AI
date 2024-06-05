import React, { useEffect, useState } from "react";
import TransactionChart from "../../Components/Admin/dashboard/TransactionChart";
import TransactionTable from "../../Components/Admin/dashboard/TransactionTable";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminDashboardPage() {
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState({});
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="mt-20 p-6">
            <div className="flex flex-col gap-8">
                <TransactionChart loading={loading} transactions={transaction} />
                <TransactionTable loading={loading} transactions={transaction.transactions} />
            </div>
            
        </div>
    )
}
export default AdminDashboardPage;