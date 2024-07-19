import { useEffect, useState, useCallback } from "react";
import MetricsCard from "../../Components/Admin/training/MetricsCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Table, Badge, Button } from "flowbite-react";
import { format } from "date-fns";
import { FaCheck } from "react-icons/fa";
import { HiCheck } from "react-icons/hi";
import TrainModal from "../../Components/Admin/training/TrainModal";
import ToastMsg from "../../Components/Other/ToastMsg";
import DeployConfirmModal from "../../Components/Admin/training/DeployConfirmModal";

function AdminModelPage() {
    const [models, setModels] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [selectedRunId, setSelectedRunId] = useState(0);
    const [trainModalOpen, setTrainModalOpen] = useState(false); 
    const [successTrainToastOpen, setSuccessTrainToastOpen] = useState(false);
    const [deployConfirmation, setDeployConfirmation] = useState(false);
    const navigate = useNavigate();

    const fetchMetrics = useCallback(async () => {
        if (selectedRunId !== null && models !== null) {
            const res = axios.get("/api/maintenance/model-metric", {
                params : {
                    run_id: models[selectedRunId].run_id
                }
            })
            .then((res) => {
                if (res.status === 200) {
                    setMetrics(res.data);
                    return res.data.status;
                }
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    navigate("/login");
                }
            });
            return res;
        }
    }, [selectedRunId, models, navigate]);

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
    }, [navigate])

    useEffect(() => {
        let intervalId;

        const checkAndSetInterval = async () => {
            const status = await fetchMetrics();
            if (status === "running") {
                intervalId = setInterval(fetchMetrics, 10000);
            } else {
                clearInterval(intervalId);
            }
        };

        checkAndSetInterval();

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [selectedRunId, models, fetchMetrics]);
    return (
        <div className="mt-24 px-5">
            <ToastMsg color="green" icon={<FaCheck className="h-5 w-5" />} open={successTrainToastOpen} setOpen={setSuccessTrainToastOpen} message="Training Job submitted" />
            <TrainModal open={trainModalOpen} setOpen={setTrainModalOpen} models={models} setSuccessTrainToastOpen={setSuccessTrainToastOpen} />
            <DeployConfirmModal setModels={setModels} selectedRunId={selectedRunId} open={deployConfirmation} setOpen={setDeployConfirmation} />
            <div className="flex flex-row gap-2 items-center mb-4">
                <h1 className="text-2xl font-bold">Model V{selectedRunId} Metric</h1>
                {metrics?.status === "finished" ? (
                    <Badge color="success">Finished</Badge>
                ) : metrics?.status === "running" ?
                (<Badge color="warning">Running</Badge>) :
                (<Badge color="failure">Fails</Badge>) }
            </div>
            <MetricsCard metrics={metrics} />
            <div className="flex flex-row flex-wrap justify-between items-center">
                <h1 className="text-2xl font-bold my-8">Model List</h1>
                <div className="flex-row flex justify-between gap-3">
                    <Button onClick={() => setTrainModalOpen(true)} className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-600">+ Train</Button>
                    <Button onClick={() => {setDeployConfirmation(true)}} disabled={metrics === null || metrics.status !== "finished" || models === null || models[selectedRunId].deployed} className="focus:ring-green-300" color="light">Deploy</Button>
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
                        <Table.HeadCell>
                            <span className="sr-only">Selected</span>
                        </Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {models !== null ? (
                            models.map((model, idx) => (
                            <Table.Row onClick={() => {setSelectedRunId(idx)}} key={idx} className="cursor-pointer">
                                <Table.Cell>Model {model.version}</Table.Cell>
                                <Table.Cell>{model.test_mae?.toFixed(2)}</Table.Cell>
                                <Table.Cell>{model.test_map?.toFixed(4)}</Table.Cell>
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
                                <Table.Cell>
                                    {selectedRunId === idx && 
                                        <HiCheck className="text-green-500" size={20} />
                                    }
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