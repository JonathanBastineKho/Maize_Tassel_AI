import { Avatar, Card, Table, Label, Progress } from "flowbite-react";
import { format, fromUnixTime, isToday } from 'date-fns';
import { FaLocationCrosshairs } from "react-icons/fa6";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from "react";

const formatDay = (timestamp) => {
    const date = fromUnixTime(timestamp);
    return isToday(date) ? 'Today' : format(date, 'EEE');
  };

function WeatherForecast({ weatherData, location, setLocation}) {
    const [showMap, setShowMap] = useState(false);
    const [mapPosition, setMapPosition] = useState(null);

    if (!weatherData) {
        return (
          <Card>
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </Card>
        );
      }
    const calculateTemperatureProgress = (min, max, current) => {
        const range = max - min;
        const progress = ((current - min) / range) * 100;
        return Math.max(0, Math.min(100, progress));
    };

    const futureWeather = weatherData.list.filter((day) => !isToday(fromUnixTime(day.dt)));
    const currWeather = weatherData.list.filter((day) => isToday(fromUnixTime(day.dt)));

    const handleLocationSelect = () => {
        if (mapPosition) {
            setLocation({ lat: mapPosition.lat, lon: mapPosition.lng });
        }
    };

    function LocationMarker() {
        const map = useMapEvents({
            click(e) {
                setMapPosition(e.latlng);
                map.flyTo(e.latlng, map.getZoom());
                handleLocationSelect();
            }
        });

        return mapPosition === null ? null : (
            <Marker position={mapPosition} />
        );
    }
    
    return (
        <Card className="w-full">
            <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row justify-between gap-3 items-center">
                    <div className="flex flex-col gap-0.5 items-center">
                        <Avatar 
                            img={`http://openweathermap.org/img/wn/${currWeather[0].weather[0].icon}@2x.png`}
                            size="lg"
                        />
                        <Label className="text-sm text-gray-500">{currWeather[0].pop ? `${Math.round(currWeather[0].pop * 100)}%` : ''}</Label>
                    </div>
                    <h2 className="font-bold text-gray-800 text-xl">{weatherData.city.name}</h2>
                </div>
                <button className="p-3 hover:bg-gray-100 rounded-lg h-fit" onClick={() => setShowMap(!showMap)}>
                    <FaLocationCrosshairs className="text-gray-500 w-6 h-6" />
                </button>
            </div>
            {showMap ? (
                <div className="h-96 w-full">
                    <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker />
                    </MapContainer>
                </div>
            ) : (
                <div>
                    <Table striped>
                        <Table.Body>
                            {futureWeather.map((day, index) => (
                                <Table.Row key={index}>
                                    <Table.Cell>
                                        <div className="flex flex-row jusitfy-between gap-6 items-center">
                                            <div className="w-8">
                                                <Label>{formatDay(day.dt)}</Label>
                                            </div>
                                            <div className="flex flex-col gap-1 items-center">
                                                <Avatar 
                                                    img={`http://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                                                    size="sm"
                                                />
                                                <Label className="text-xs text-gray-500">{day.pop ? `${Math.round(day.pop * 100)}%` : ''}</Label>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-row gap-4 items-center justify-between">
                                            <Label className="text-gray-500">{Math.round(day.temp.min - 273.15)}°C</Label>
                                            <div className="flex-grow">
                                                <Progress className="w-full min-w-12"
                                                color="orange" 
                                                progress={calculateTemperatureProgress(day.temp.min, day.temp.max, day.temp.day)} 
                                                theme={{color : {orange : "bg-gradient-to-r from-orange-400 to-red-400"}}}
                                                />
                                            </div>
                                            <Label className="text-gray-500">{Math.round(day.temp.max - 273.15)}°C</Label>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            )}
        </Card>
    );
}

export default WeatherForecast;