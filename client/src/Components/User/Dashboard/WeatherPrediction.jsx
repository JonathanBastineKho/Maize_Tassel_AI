import { Card, Datepicker } from "flowbite-react";
import React from "react";
import { useState } from "react";
import { Button, Spinner } from "flowbite-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { datepickerTheme } from "../../theme";
import axios from "axios";
import { format, set } from "date-fns";
import { FaRegCalendarAlt, FaChartBar, FaCaretDown } from "react-icons/fa";
import { IoMdTrendingDown, IoMdTrendingUp } from "react-icons/io";
import CountUp from "react-countup";
import { data } from "autoprefixer";

function WeatherPrediction({}) {
  const [position, setPosition] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  const today = new Date();
  const minDate = new Date();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chosenDays, setChosenDays] = useState(0);
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 7))
  );
  const [averageTemp, setAverageTemp] = useState(null);

  const handleAPIButton = () => {
    console.log("API Button Clicked");
    // call the api
    let lat = position.lat;
    let lon = position.lng;
    let api_key = "9ddf180c870570a04b00a5a3bd82da54";
    let cnt = 7;
    axios
      .get(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${api_key}`
      )
      .then((res) => {
        console.log(res.data.daily);
        console.log("");
        setWeatherData(res.data.daily);
        setChosenDays(0);
        getAverageTemp();
      })
      .catch((err) => {
        console.log("error");
        console.log(err);
      });
  };


  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        setPosition(e.latlng);
        // You can use position.lat and position.lng for the weather API
        console.log(`Latitude: ${e.latlng.lat}, Longitude: ${e.latlng.lng}`);
      },
    });

    return position === null ? null : (
      <Marker position={position}>
        <Popup>
          You are here: {position.lat}, {position.lng}
        </Popup>
      </Marker>
    );
  };

  const getAverageTemp = () => { 
    let avg = (weatherData[chosenDays].temp.day + weatherData[chosenDays].temp.night + weatherData[chosenDays].temp.eve + weatherData[chosenDays].temp.morn) / 4;
    setAverageTemp(parseFloat(avg / 10).toFixed(1));
  }

  const WeatherDisplay = ({ data }) => {
    if (!data) {
      return <Spinner />;
    }

    const handleSelectedDateChange = (date) => {
      setSelectedDate(new Date(date));
      const differenceInTime = selectedDate.getTime() - today.getTime();
      const differenceInDays = Math.round(
        differenceInTime / (1000 * 3600 * 24)
      );
      console.log(differenceInDays);
      setChosenDays(4); // Hardcoded for now
      getAverageTemp();
    };

    return (
      <div className="flex">
        <div className="flex flex-col justify-end">
          {/* <h3 className="text-gray-500  justify-end font-semibold text-normal">
            Select Days
          </h3> */}
          <Datepicker
            theme={datepickerTheme}
            minDate={minDate}
            maxDate={endDate}
            value={format(selectedDate, "MMMM d, yyyy")}
            onSelectedDateChanged={(date) => handleSelectedDateChange(date)}
          />
          <div className="grid grid-cols-3 gap-y-2 gap-x-2 mt-6">
            <Card style={{ minHeight: "120px", maxHeight: "120px" }}>
              <p className="text-gray-500 text-2xs font-semibold text-normal">
                Clouds
              </p>
              <div className="flex flex-row justify-between items-center">
                <h2 className="text-gray-900 font-semibold text-lg">
                  {data[chosenDays].clouds}
                </h2>
              </div>
            </Card>
            <Card style={{ minHeight: "120px", maxHeight: "120px" }}>
              <p className=" text-gray-500 text-2xs font-semibold text-normal">
                Temperature
              </p>
              <div className="flex flex-row justify-between items-center">
                <h2 className="text-stext-gray-900 font-semibold text-lg">
                  {averageTemp}°C
                </h2>
              </div>
            </Card>
            <Card style={{ minHeight: "120px", maxHeight: "120px" }}>
              <p
                style={{ height: "20px" }}
                className=" fixedHeightP text-sm text-gray-500 font-semibold text-normal"
              >
                Weather
              </p>
              <div className="flex flex-row justify-between items-center">
                <h2 className="text-gray-900 font-semibold text-lg">
                  {data[chosenDays].weather[0].description}
                </h2>
              </div>
            </Card>
          </div>
          <div className="flex flex-col mt-4 gap-y-1">
            <p className="text-gray-500 text-2xs font-semibold text-normal">
              Summary
            </p>
            <div className="flex flex-row justify-between items-center">
              <h2 className="text-gray-900 font-bold text-xl">
                {data[chosenDays].summary}
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="mb-6">
        <h2 className="text-gray-500 font-semibold text-normal">
          Weather Prediction
        </h2>
        <div className="flex flex-row gap-y-4 gap-x-8 ">
          <div>
            <MapContainer
              center={[51.505, -0.09]}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: "400px", width: "450px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">
              OpenStreetMap</a> contributors'
              />
              <LocationMarker />
            </MapContainer>
          </div>
          <div className="flex flex-col">
            <div className="pb-20">
              <WeatherDisplay data={weatherData} />
            </div>
            <div className="w-full">
              <Button onClick={() => handleAPIButton()} className={`w-full bg-green-600 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800`}>
                Predict 
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

export default WeatherPrediction;
