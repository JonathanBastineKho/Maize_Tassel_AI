import { Card } from "flowbite-react";
import { Table } from "flowbite-react";
import { spinnerTheme } from "../../theme";
import { Spinner, Badge } from "flowbite-react";
import { format } from "date-fns";

function TransactionTable({transactions, loading}) {

    return (
        <Card>
            <div className="flex flex-row">
                <div className="flex flex-col gap-3 mb-2">
                    <h2 className="leading-none text-2xl font-bold text-gray-900">Transactions</h2>
                    <p className="text-gray-500">This is a list of latest transactions</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <Table.Head>
                        <Table.HeadCell>Transaction</Table.HeadCell>
                        <Table.HeadCell>Date</Table.HeadCell>
                        <Table.HeadCell>Amount</Table.HeadCell>
                        <Table.HeadCell>Status</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <Table.Row>
                            <Table.Cell colSpan={4} className="text-center">
                            <Spinner theme={spinnerTheme} aria-label="Loading transactions" />
                            </Table.Cell>
                        </Table.Row>
                        ) : (
                        transactions.map((transaction, index) => (
                            <Table.Row key={index}>
                                <Table.Cell>{transaction.name}</Table.Cell>
                                <Table.Cell>{format(new Date(transaction.date), "MMM dd, yyyy")}</Table.Cell>
                                <Table.Cell>{transaction.amount.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                })}</Table.Cell>
                                <Table.Cell>{transaction.success ? <Badge className="w-fit" color="success">Success</Badge>: <Badge className="w-fit" color="failure">Failed</Badge>}</Table.Cell>
                            </Table.Row>
                        ))
                    )}
                    </Table.Body>
                </Table>
            </div>
        </Card>
    );
}

export default TransactionTable;