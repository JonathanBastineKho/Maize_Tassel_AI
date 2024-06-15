import { Modal, Label, Button, Datepicker, TextInput, Checkbox } from "flowbite-react";
import { useState } from "react";
import { format } from "date-fns";

// Date upload, processing status, maize tassel count, prediction feedback (optional)

function FilterModal({ open, setOpen }) {
    return (
        <Modal size="2xl" show={open} onClose={() => setOpen(false)}>
            <Modal.Header>Filter</Modal.Header>
            <Modal.Body>
                <div className="flex flex-col gap-6">
                    <div>
                        <Label>Upload Date</Label>
                        <div className="flex flex-row w-full gap-4 md:gap-6">
                            <div className="w-full">
                                <Label className="text-gray-800 text-xs">Start Date</Label>
                                <Datepicker />
                            </div>
                            <div className="w-full">
                                <Label className="text-gray-800 text-xs">End Date</Label>
                                <Datepicker />
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label>Tassel Count</Label>
                        <div className="flex flex-row w-full gap-4 md:gap-6">
                            <div className="w-full">
                                <Label className="text-gray-800 text-xs">Minimum</Label>
                                <TextInput min={0} type="number" placeholder="Minimum tassel count" />
                            </div>
                            <div className="w-full">
                                <Label className="text-gray-800 text-xs">Maximum</Label>
                                <TextInput type="number" placeholder="Maximum tassel count" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Label>Processing Status</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="flex flex-row gap-2 items-center">
                                <Checkbox />
                                <Label>All</Label>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <Checkbox />
                                <Label>In queue</Label>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <Checkbox />
                                <Label>Processing</Label>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <Checkbox />
                                <Label>Done</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row gap-3 justify-end mt-8">
                    <Button className="bg-green-500">Apply filter</Button>
                    <Button color="light">Reset</Button>
                </div>
            </Modal.Body>
        </Modal>
    );
}

export default FilterModal;