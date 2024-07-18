import { useEffect, useState } from "react";
import MetricsCard from "../../Components/Admin/training/MetricsCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Table, Badge, Button } from "flowbite-react";
import { format } from "date-fns";
import { FaCheck } from "react-icons/fa";
import TrainModal from "../../Components/Admin/training/TrainModal";
import ToastMsg from "../../Components/Other/ToastMsg";

function AdminModelPage() {
    const [models, setModels] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [selectedRunId, setSelectedRunId] = useState(null);
    const [trainModalOpen, setTrainModalOpen] = useState(false); 
    const [successTrainToastOpen, setSuccessTrainToastOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/api/maintenance/model-list")
        .then((res) => {
            if (res.status === 200) {
                setModels(res.data.models);
                setSelectedRunId(res.data.default_selected_idx);
            }
        })
        .catch((err) => {
            if (err.response.status === 401) {
                navigate("/login");
            }
        })
    }, [])

    useEffect(() => {
        if (selectedRunId !== null && models !== null) {
            axios.get("/api/maintenance/model-metric", {
                params : {
                    run_id: models[selectedRunId].run_id
                }
            })
            .then((res) => {
                if (res.status === 200) {
                    setMetrics(res.data);
                }
            })
            .catch((err) => {
                if (err.response.status === 401) {
                    navigate("/login");
                }
            })
        }
    }, [selectedRunId, models])

    return (
        <div className="mt-24 px-5">
            <ToastMsg color="green" icon={<FaCheck className="h-5 w-5" />} open={successTrainToastOpen} setOpen={setSuccessTrainToastOpen} message="Training Job submitted" />
            <TrainModal open={trainModalOpen} setOpen={setTrainModalOpen} models={models} setSuccessTrainToastOpen={setSuccessTrainToastOpen} />
            <h1 className="text-2xl font-bold mb-4">Model V0 Metric</h1>
            <MetricsCard metrics={metrics} />
            <div className="flex flex-row flex-wrap justify-between items-center">
                <h1 className="text-2xl font-bold my-8">Model List</h1>
                <div className="flex-row flex justify-between gap-3">
                    <Button onClick={() => setTrainModalOpen(true)} className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-600">+ Train</Button>
                    <Button className="focus:ring-green-300" color="light">Deploy</Button>
                </div>
            </div>
            <div className="overflow-x-auto rounded rounded-lg">
                <Table hoverable>
                    <Table.Head>
                        <Table.HeadCell>Version</Table.HeadCell>
                        <Table.HeadCell>MAE</Table.HeadCell>
                        <Table.HeadCell>MAP</Table.HeadCell>
                        <Table.HeadCell>Deployed</Table.HeadCell>
                        <Table.HeadCell>Finished Train Date</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {models !== null ? (
                            models.map((model, idx) => (
                            <Table.Row key={idx}>
                                <Table.Cell>Model {model.version}</Table.Cell>
                                <Table.Cell>{model.test_mae}</Table.Cell>
                                <Table.Cell>{model.test_map}</Table.Cell>
                                <Table.Cell>{model.deployed ? (
                                    <div className="w-fit">
                                        <Badge color="success">In Use</Badge>
                                    </div>
                                ) : (
                                    <div className="w-fit">
                                        <Badge color="gray">Not used</Badge>
                                    </div>
                                )}</Table.Cell>
                                <Table.Cell>
                                    {model.finish_train_date !== null ? (format(model.finish_train_date, "MMM dd, yyyy")) : ("-")}
                                </Table.Cell>
                            </Table.Row>
                            ))
                        ) : (
                            <Table.Row>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </div>
        </div>
    );
}

export default AdminModelPage;