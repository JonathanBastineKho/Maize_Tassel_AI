import { Card, Table } from "flowbite-react";

function WorkerTable({ workerStats }){
    return (
        <Card theme={{
            root: {
                children: "flex h-full flex-col justify-start gap-4 p-6"
            }
        }}>
            <h2 className="leading-none text-2xl font-bold text-gray-900">Worker list</h2>
            <Table>
                <Table.Head>
                    <Table.HeadCell>Worker</Table.HeadCell>
                    <Table.HeadCell className="whitespace-nowrap">Processing Speed</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {workerStats.map((worker, idx) => (
                        <Table.Row key={idx}>
                            <Table.Cell className="whitespace-nowrap">Worker {idx+1}</Table.Cell>
                            <Table.Cell>{worker.rate} image/s</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </Card>
    );
}

export default WorkerTable;