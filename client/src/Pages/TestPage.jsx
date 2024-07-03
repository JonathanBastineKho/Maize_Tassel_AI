import React from "react";
import { useState, useRef } from "react";
import { Button } from "flowbite-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

// https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude={part}&appid={API key}

function TestPage() {
  const [position, setPosition] = useState(null);
  const handleAPIButton = () => {
    console.log("API Button Clicked");
    // call the api
    let lan = position.lat;
    let lon = position.lng;
    let api_key = "bfb1bedf1a1ac97c426fc7f2b4644c66";
    axios
      .get(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lan}&lon=${lon}&exclude={part}&appid=${api_key}`
      )
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
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

  return (
    <>
      <Button onClick={() => handleAPIButton()}>Call API </Button>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div style={{ width: "600px", height: "400px" }}>
          <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
            />
            <LocationMarker />
          </MapContainer>
        </div>
      </div>
    </>
  );
}

export default TestPage;
