import { Table, Card, Badge } from "flowbite-react";

function SubscriptionHistoryTable({ transactions }) {
  return (
    <Card
      className="mt-8"
      theme={{
        root: {
          base: "flex rounded-lg border border-gray-200 bg-white shadow-sm",
          children: "flex flex-wrap h-full flex-row justify-between gap-4",
        },
      }}
    >
      <div className="p-8 w-full">
        <h2 className="font-bold text-xl mb-5">Subscription History</h2>
        <div className="w-full overflow-auto">
          <Table>
            <Table.Head>
              <Table.HeadCell>Start Date</Table.HeadCell>
              <Table.HeadCell>End Date</Table.HeadCell>
              <Table.HeadCell>Amount</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>{new Date(transaction.start_date).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}</Table.Cell>
                    <Table.Cell>{new Date(transaction.end_date).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}</Table.Cell>
                    <Table.Cell>$ {transaction.amount}</Table.Cell>
                    <Table.Cell>{transaction.status ? <Badge className="w-fit" color="success">Success</Badge>: <Badge className="w-fit" color="failure">Failed</Badge> }</Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell
                    colSpan={4}
                    className="text-center py-4 text-gray-500"
                  >
                    No subscription history available
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      </div>
    </Card>
  );
}

export default SubscriptionHistoryTable;
