import { Modal, Label, Button, Datepicker, TextInput, Checkbox } from "flowbite-react";
import { useState } from "react";
import { format } from "date-fns";
import { datepickerTheme, inputTheme } from "../theme";
import { useSearchParams } from "react-router-dom";
import { isValidDate, isValidInteger } from "../theme";

// Date upload, processing status, maize tassel count, prediction feedback (optional)
const localModalTheme = {
    root : {
        base : "fixed inset-x-0 top-0 z-50 h-screen md:inset-0 md:h-full",
    },
    body : {
        base : "flex-1 p-6"
    }
}

function FilterModal({ open, setOpen }) {

    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        start_date: isValidDate(searchParams.get("start_date")) ? new Date(searchParams.get("start_date")) : null,
        end_date: isValidDate(searchParams.get("end_date")) ? new Date(searchParams.get("end_date")) : null,
        tassel_min: isValidInteger(searchParams.get("tassel_min")) ? parseInt(searchParams.get("tassel_min")) : null,
        tassel_max: isValidInteger(searchParams.get("tassel_max")) ? parseInt(searchParams.get("tassel_max")) : null,
        in_queue: searchParams.has("in_queue"),
        processing: searchParams.has("processing"),
        done: searchParams.has("done"),
    });

    const resetFilter = () => {
        setFilters({
            start_date: null,
            end_date: null,
            tassel_min: null,
            tassel_max: null,
            in_queue: false,
            processing: false,
            done: false
        })
    }

    const applyFilter = () => {
        const newSearchParams = new URLSearchParams();
    
        if (filters.start_date !== null) {
            const startDateUTC = new Date(Date.UTC(filters.start_date.getFullYear(), filters.start_date.getMonth(), filters.start_date.getDate()));
            newSearchParams.set("start_date", startDateUTC.toISOString().slice(0, 10));
        }
        if (filters.end_date !== null) {
            const endDateUTC = new Date(Date.UTC(filters.end_date.getFullYear(), filters.end_date.getMonth(), filters.end_date.getDate()));
            newSearchParams.set("end_date", endDateUTC.toISOString().slice(0, 10));
        }        
        if (filters.tassel_min !== null) {
            newSearchParams.set("tassel_min", filters.tassel_min.toString());
        }
        if (filters.tassel_max !== null) {
            newSearchParams.set("tassel_max", filters.tassel_max.toString());
        }
        if (!(filters.in_queue && filters.processing && filters.done)) {
            if (filters.in_queue) {
                newSearchParams.set("in_queue", "true");
            }
            if (filters.processing) {
                newSearchParams.set("processing", "true");
            }
            if (filters.done) {
                newSearchParams.set("done", "true");
            }
        }
    
        setSearchParams(newSearchParams);
        setOpen(false);
    }

    return (
        <Modal style={{overflow: 'visible'}} theme={localModalTheme} size="2xl" show={open} onClose={() => setOpen(false)}>
            <Modal.Header>Filter</Modal.Header>
            <Modal.Body>
                <div className="flex flex-col gap-6">
                    <div>
                        <Label>Upload Date</Label>
                        <div className="flex flex-row w-full gap-4 md:gap-6">
                            <div className="w-full">
                                <Label className="text-gray-800 text-xs">Start Date</Label>
                                <Datepicker
                                placeholder="Enter date"
                                value={filters.start_date ? format(filters.start_date, 'MMMM d, yyyy') : ''}
                                theme={datepickerTheme}
                                onSelectedDateChanged={(date) => {setFilters((prev) => ({
                                    ...prev,
                                    start_date: new Date(date)
                                }))}}
                                />
                            </div>
                            <div className="w-full">
                                <Label className="text-gray-800 text-xs">End Date</Label>
                                <Datepicker
                                placeholder="Enter date"
                                value={filters.end_date ? format(filters.end_date, 'MMMM d, yyyy') : ''}
                                theme={datepickerTheme} 
                                onSelectedDateChanged={(date) => {setFilters((prev) => ({
                                    ...prev,
                                    end_date: new Date(date)
                                }))}}/>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label>Tassel Count</Label>
                        <div className="flex flex-row w-full gap-4 md:gap-6">
                            <div className="w-full">
                                <Label className="text-gray-800 text-xs">Minimum</Label>
                                <TextInput theme={inputTheme} min={0} type="number" placeholder="Minimum tassel count"
                                value={filters.tassel_min !== null ? filters.tassel_min : ''}
                                onChange={(e) => {
                                    const value = e.target.value !== '' ? parseInt(e.target.value) : null;
                                    setFilters((prev) => ({
                                        ...prev,
                                        tassel_min: value,
                                        tassel_max: value !== null && (prev.tassel_max === null || value > prev.tassel_max) ? value : prev.tassel_max,
                                    }));
                                }} />
                            </div>
                            <div className="w-full">
                                <Label className="text-gray-800 text-xs">Maximum</Label>
                                <TextInput theme={inputTheme} type="number" placeholder="Maximum tassel count"
                                 value={filters.tassel_max !== null ? filters.tassel_max : ''}
                                 min={filters.tassel_min !== null ? filters.tassel_min : 0}
                                 onChange={(e) => {
                                     const value = e.target.value !== '' ? parseInt(e.target.value) : null;
                                     setFilters((prev) => ({
                                         ...prev,
                                         tassel_max: value,
                                     }));
                                 }}/>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Label>Processing Status</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="flex flex-row gap-2 items-center">
                                <Checkbox className="text-green-500 focus:ring-2 focus:ring-green-500"
                                checked={filters.in_queue && filters.processing && filters.done}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setFilters((prev) => ({
                                        ...prev,
                                        in_queue: checked,
                                        processing: checked,
                                        done: checked,
                                    }));
                                }} />
                                <Label>All</Label>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <Checkbox className="text-green-500 focus:ring-2 focus:ring-green-500"
                                checked={filters.in_queue}
                                onChange={(e) => {
                                    setFilters((prev) => ({
                                        ...prev,
                                        in_queue: e.target.checked,
                                    }));
                                }}/>
                                <Label>In queue</Label>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <Checkbox className="text-green-500 focus:ring-2 focus:ring-green-500"
                                checked={filters.processing}
                                onChange={(e) => {
                                    setFilters((prev) => ({
                                        ...prev,
                                        processing: e.target.checked,
                                    }));
                                }} />
                                <Label>Processing</Label>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <Checkbox className="text-green-500 focus:ring-2 focus:ring-green-500"
                                checked={filters.done}
                                onChange={(e) => {
                                    setFilters((prev) => ({
                                        ...prev,
                                        done: e.target.checked,
                                    }));
                                }} />
                                <Label>Done</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row gap-3 justify-end mt-8">
                    <Button onClick={applyFilter} className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-600">Apply filter</Button>
                    <Button onClick={resetFilter} color="light" className="focus:ring-4 focus:ring-green-300">Reset</Button>
                </div>
            </Modal.Body>
        </Modal>
    );
}

export default FilterModal;

