import { Checkbox, Table, Badge, Avatar } from "flowbite-react";
import { BsThreeDotsVertical } from "react-icons/bs";

function UserImageTable() {
    return (
        <div className="overflow-x-auto">
            <Table hoverable>
                <Table.Head className="p-4">
                    <Table.HeadCell><Checkbox /></Table.HeadCell>
                    <Table.HeadCell>Name</Table.HeadCell>
                    <Table.HeadCell>Size</Table.HeadCell>
                    <Table.HeadCell>Status</Table.HeadCell>
                    <Table.HeadCell>Date Uploaded</Table.HeadCell>
                    <Table.HeadCell>
                        <span className="sr-only">Action</span>
                    </Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                    <Table.Row>
                        <Table.Cell className="">
                            <Checkbox />
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 flex flex-row gap-2 items-center">
                            <Avatar size="xs" img="https://storage.googleapis.com/corn_sight_public/test_thumbnail.jpg" />
                            DJI_01.jpg
                        </Table.Cell>
                        <Table.Cell>5.4 MB</Table.Cell>
                        <Table.Cell>
                            <Badge className="w-fit" color="success">Success</Badge>
                        </Table.Cell>
                        <Table.Cell>May 9, 2024</Table.Cell>
                        <Table.Cell><BsThreeDotsVertical /></Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell className="">
                            <Checkbox />
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 flex flex-row gap-2 items-center">
                            <Avatar size="xs" img="https://storage.googleapis.com/corn_sight_public/test_thumbnail.jpg" />
                            DJI_02.jpg
                        </Table.Cell>
                        <Table.Cell>5.4 MB</Table.Cell>
                        <Table.Cell>
                            <Badge className="w-fit" color="gray">In queue</Badge>
                        </Table.Cell>
                        <Table.Cell>May 9, 2024</Table.Cell>
                        <Table.Cell><BsThreeDotsVertical /></Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell className="">
                            <Checkbox />
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 flex flex-row gap-2 items-center">
                            <Avatar size="xs" img="https://storage.googleapis.com/corn_sight_public/test_thumbnail.jpg" />
                            DJI_03.jpg
                        </Table.Cell>
                        <Table.Cell>5.4 MB</Table.Cell>
                        <Table.Cell>
                            <Badge className="w-fit" color="warning">Processing</Badge>
                        </Table.Cell>
                        <Table.Cell>May 9, 2024</Table.Cell>
                        <Table.Cell><BsThreeDotsVertical /></Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell className="">
                            <Checkbox />
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 flex flex-row gap-2 items-center">
                            <Avatar size="xs" img="https://storage.googleapis.com/corn_sight_public/test_thumbnail.jpg" />
                            DJI_04.jpg
                        </Table.Cell>
                        <Table.Cell>5.4 MB</Table.Cell>
                        <Table.Cell>
                            <Badge className="w-fit" color="failure">Error</Badge>
                        </Table.Cell>
                        <Table.Cell>May 9, 2024</Table.Cell>
                        <Table.Cell><BsThreeDotsVertical /></Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        </div>
    );
}

export default UserImageTable;