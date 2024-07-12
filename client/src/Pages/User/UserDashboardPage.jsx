import { Card, Datepicker, Button, Label } from "flowbite-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegCalendarAlt, FaChartBar, FaCaretDown } from "react-icons/fa";
import { IoMdTrendingDown, IoMdTrendingUp } from "react-icons/io";
import axios from "axios";
import CountUp from "react-countup";
import { format } from "date-fns";
import HistoricalChart from "../../Components/User/Dashboard/HistoricalChart";
import FolderPicker from "../../Components/User/Dashboard/FolderPicker";
import { datepickerTheme } from "../../Components/theme";
import WeatherChart from "../../Components/User/Dashboard/WeatherChart";
import WeatherForecast from "../../Components/User/Dashboard/WeatherForecast";

function UserDashboardPage() {
    const navigate = useNavigate();
    const [historicalData, setHistoricalData] = useState({date_count: []});
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedFolder, setSelectedFolder] = useState({name: "Home", id: null});
    const [openFolder, setOpenFolder] = useState(false);
    const [folders, setFolders] = useState([{name: "Home", id: null}]);
    const [firstSearch, setFirstSearch] = useState(true);
    const [location, setLocation] = useState(null);
    const [weather, setWeather] = useState(null);
    const [weatherQuotaExceed, setWeatherQuotaExceed] = useState(false);
    const prevLocationRef = useRef();

    useEffect(()=>{
        const params = {};
        if (selectedFolder.id !== null) {
            params.folder_id = selectedFolder.id;
        }

        if (!firstSearch) {
            params.start_date = format(startDate, "yyyy-MM-dd");
            params.end_date = format(endDate, "yyyy-MM-dd");
        }

        axios.get("/api/service/view-historical-count", {params})
        .then((res) => {
            if (res.status === 200) {
                setHistoricalData(res.data);
                // Set initial start and end date
                if (firstSearch && res.data.date_count.length > 0) {
                    setFirstSearch(false);
                    setStartDate(new Date(res.data.date_count[0].date));
                    setEndDate(new Date(res.data.date_count[res.data.date_count.length - 1].date));
                }
            }
        })
        .catch((err) => {
            if (err.response.status === 401) {
                navigate("/login")
            }
        })
    }, [selectedFolder, startDate, endDate])

    useEffect(() => {
        axios.get("/api/service/search-all-folders")
        .then((res) => {
            if (res.status === 200) {
                setFolders([{name: "Home", id: null}, ...res.data.folder_list])
            }
        })
        .catch((err) => {
            if (err.response.status === 401) {
                navigate("/login");
            }
        })
    }, [])

    useEffect(() => {
        if (!navigator.geolocation){
            setLocation({
                lon : 103.819839,
                lat : 1.352083
            });
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lon : position.coords.longitude,
                    lat : position.coords.latitude
                });
            },
            (error) => {
                setLocation({
                    lon : 103.819839,
                    lat : 1.352083
                });
            }
        )
    }, [])

    const isLocationChanged = (prevLoc, currLoc) => {
        if (!prevLoc || !currLoc) return true;
        return prevLoc.lat !== currLoc.lat || prevLoc.lon !== currLoc.lon;
      };

    useEffect(() => {
        if (location !== null && isLocationChanged(prevLocationRef.current, location)){
            axios.get("/api/service/view-weather-forecast", {
                params : {lat: location.lat, lon : location.lon}
            })
            .then((res) => {
                if (res.status === 200) {
                    setWeather(res.data);
                    setWeatherQuotaExceed(false);
                }
            })
            .catch((err) => {
                if (err.response.status === 400) {
                    navigate("/login")
                } else if (err.response.status === 500) {
                    setWeatherQuotaExceed(true);
                }
            })
            prevLocationRef.current = location;
        }
    }, [location])

    return (
        <div className="mt-20 p-6">
            {/* Filters */}
            <div className="flex flex-row justify-between flex-wrap items-center  mb-5">
                <h1 className="font-extrabold text-2xl">Historical Data</h1>
                <div className="relative block md:hidden">
                    <Button color="light" className="block md:hidden" onClick={() => setOpenFolder(!openFolder)}>
                        <span>{selectedFolder.name}</span>
                        <FaCaretDown className="w-5 h-5 text-gray-500 ml-3" />
                    </Button>
                    <div style={{zIndex: 80}} className={`${openFolder ? '' : 'hidden'} block md:hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5`}>
                        <FolderPicker setOpen={setOpenFolder} folders={folders} setSelectedFolder={setSelectedFolder} />
                    </div>
                </div>
            </div>
            <div className="flex flex-row justify-between mb-5 items-end">
                <div className="flex flex-row gap-3 justify-between">
                    <div>
                        <Label className="text-gray-500">Start date</Label>
                        <Datepicker
                        theme={datepickerTheme}
                        maxDate={endDate}
                        value={format(startDate, "MMMM d, yyyy")} 
                        onSelectedDateChanged={(date) => {setStartDate(new Date(date))}} />
                    </div>
                    <div>
                        <Label className="text-gray-500">End date</Label>
                        <Datepicker theme={datepickerTheme}
                        minDate={startDate}
                        value={format(endDate, "MMMM d, yyyy")} 
                        onSelectedDateChanged={(date) => {setEndDate(new Date(date))}} />
                    </div>
                </div>
                {/* Dropdown */}
                <div className="relative hidden md:block">
                    <Button color="light" className="hidden md:block" onClick={() => setOpenFolder(!openFolder)}>
                        <span>{selectedFolder.name}</span>
                        <FaCaretDown className="w-5 h-5 text-gray-500 ml-3" />
                    </Button>
                    <div className={`${openFolder ? '' : 'hidden'} absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5`}>
                        <FolderPicker setOpen={setOpenFolder} folders={folders} setSelectedFolder={setSelectedFolder} />
                    </div>
                </div>
            </div>
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
                <Card>
                    <p className="text-gray-500 font-semibold text-normal">Daily average</p>
                    <div className="flex flex-row justify-between items-center">
                        <h2 className="text-gray-900 font-bold text-2xl"><CountUp end={historicalData.average_per_day} duration={2} /></h2>
                        <div className="p-3 rounded rounded-full bg-blue-100">
                            <FaRegCalendarAlt className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <p className="text-gray-500 font-semibold text-normal">Total Tassel</p>
                    <div className="flex flex-row justify-between items-center">
                        <h2 className="text-gray-900 font-bold text-2xl"><CountUp end={historicalData.total} duration={2} /></h2>
                        <div className="p-3 rounded rounded-full bg-purple-100">
                            <FaChartBar className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <p className="text-gray-500 font-semibold text-normal">Highest Count</p>
                    <div className="flex flex-row justify-between items-center">
                        <h2 className="text-gray-900 font-bold text-2xl"><CountUp end={historicalData.highest} duration={2} /></h2>
                        <div className="p-3 rounded rounded-full bg-green-100">
                            <IoMdTrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <p className="text-gray-500 font-semibold text-normal">Lowest Count</p>
                    <div className="flex flex-row justify-between items-center">
                        <h2 className="text-gray-900 font-bold text-2xl"><CountUp end={historicalData.lowest} duration={2} /></h2>
                        <div className="p-3 rounded rounded-full bg-red-100">
                            <IoMdTrendingDown className="w-5 h-5 text-red-500" />
                        </div>
                    </div>
                </Card>
            </div>
            <HistoricalChart historicalData={historicalData} />
            <div className="mt-8">
                <h1 className="font-extrabold text-2xl mb-8">Weather Forecast</h1>
                <div>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        <div className="lg:col-span-2">
                            <WeatherChart weatherData={weather} />
                        </div>
                        <div className="lg:col-span-1 w-full">
                            <WeatherForecast location={location} setLocation={setLocation} weatherData={weather} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserDashboardPage;