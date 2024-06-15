import { Label, Modal, Select, Button, Radio } from "flowbite-react";
import { getData } from "country-list";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

function UserFilterModal({ open, setOpen }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        premium_account: searchParams.get("premium_account") === null ? null : searchParams.get("premium_account") === "true",
        suspension: searchParams.get("suspension") === null ? null : searchParams.get("suspension") === "true",
        google_account: searchParams.get("google_account") === null ? null : searchParams.get("google_account") === "true",
        country: searchParams.get("country") || "Any",
    });

    const setDefaultFilter = () => {
        const premiumAccount = searchParams.get("premium_account");
        const suspension = searchParams.get("suspension");
        const googleAccount = searchParams.get("google_account");
        const country = searchParams.get("country");
    
        setFilters({
            premium_account: premiumAccount === null ? null : premiumAccount === "true",
            suspension: suspension === null ? null : suspension === "true",
            google_account: googleAccount === null ? null : googleAccount === "true",
            country: country || "Any",
        });
    }

    useEffect(() => {
        setDefaultFilter();
      }, [searchParams]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFilters((prevFilters) => ({
          ...prevFilters,
          [name]: name === "country" ? value : (value === "true" ? true : value === "false" ? false : null),
        }));
      };

      const handleApplyFilter = () => {
        const newSearchParams = new URLSearchParams();
    
        if (filters.premium_account !== null) {
            newSearchParams.set("premium_account", filters.premium_account.toString());
          }
          if (filters.suspension !== null) {
            newSearchParams.set("suspension", filters.suspension.toString());
          }
          if (filters.google_account !== null) {
            newSearchParams.set("google_account", filters.google_account.toString());
          }
          if (filters.country !== "Any") {
            newSearchParams.set("country", filters.country);
          }
    
        setSearchParams(newSearchParams);
        setOpen(false);
      };
    
      const handleResetFilter = () => {
        setFilters({
          premium_account: null,
          suspension: null,
          google_account: null,
          country: "Any",
        });
      };
    
      const handleClose = () => {
        setDefaultFilter();
        setOpen(false);
      }
    
    return (
        <Modal size="lg" show={open} onClose={handleClose} >
            <Modal.Header>User Filter</Modal.Header>
            <Modal.Body>
                <div className="grid grid-cols-1 gap-2 md:gap-8 w-full">
                    <div className="flex flex-row gap-8 md:gap-12 justify-between w-full">
                        <div>
                            <div className="mb-5">
                                <Label className="text-md text-gray-900">Subscription</Label>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-row gap-2">
                                    <Radio
                                    value="true"
                                    checked={filters.premium_account === true}
                                    onChange={handleInputChange} 
                                    name="premium_account" className="checked:bg-green-500 focus:ring-green-500"  />
                                    <Label className="font-light">Premium</Label>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <Radio
                                    value="false"
                                    checked={filters.premium_account === false}
                                    onChange={handleInputChange} 
                                    name="premium_account" className="checked:bg-green-500 focus:ring-green-500" />
                                    <Label className="font-light">Regular</Label>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="mb-5">
                                <Label className="text-md text-gray-900">Status</Label>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-row gap-2">
                                    <Radio
                                    value="true"
                                    checked={filters.suspension === true}
                                    onChange={handleInputChange}
                                    name="suspension" className="checked:bg-green-500 focus:ring-green-500" />
                                    <Label className="font-light">Active</Label>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <Radio
                                    value="false"
                                    checked={filters.suspension === false}
                                    onChange={handleInputChange} 
                                    name="suspension" className="checked:bg-green-500 focus:ring-green-500" />
                                    <Label className="font-light">Suspended</Label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="mb-5">
                                <Label className="text-md text-gray-900">Account type</Label>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-row gap-2">
                                    <Radio
                                    value="true"
                                    checked={filters.google_account === true}
                                    onChange={handleInputChange}
                                    name="google_account" className="checked:bg-green-500 focus:ring-green-500" />
                                    <Label className="font-light">Google</Label>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <Radio
                                    value="false"
                                    checked={filters.google_account === false}
                                    onChange={handleInputChange}
                                    name="google_account" className="checked:bg-green-500 focus:ring-green-500" />
                                    <Label className="font-light">Regular</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="mb-2">
                            <Label>Country</Label>
                        </div>
                        <Select value={filters.country} id="country" onChange={handleInputChange} name="country">
                            <option value="Any">Any</option>
                            {getData().map((country) => (
                                <option key={country.code} value={country.name}>
                                {country.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
                <div className="flex flex-row gap-3 mt-10 w-full">
                    <Button onClick={handleApplyFilter} className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 w-full">
                        Apply Filter
                    </Button>
                    <Button onClick={handleResetFilter} color="light" className="w-full focus:ring-4 focus:ring-green-300">
                        Reset
                    </Button>
                </div>
  
            </Modal.Body>
        </Modal>
    );
}

export default UserFilterModal;