import { Card } from "flowbite-react";
import Chart from "react-apexcharts";

function WeatherChart({ weatherData }) {
  const chartOptions = {
    chart: {
      toolbar: {
        show: false,
      },
    },
    colors: ["#fb923c", "#0ea5e9", "#c084fc"],
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          fontSize: "15px",
          colors: ["#fb7185"],
          fontWeight: 550,
        },
        datetimeFormatter: {
          year: "yyyy",
          month: "MMM 'yy",
          day: "dd MMM",
          hour: "HH:mm",
        },
      },
    },
    yaxis: [
        {
          seriesName: "Temperature",
          axisTicks: {
            show: true,
          },
          axisBorder: {
            show: true,
            color: "#fb923c"
          },
          labels: {
            style: {
              colors: "#fb923c",
            },
          },
          title: {
            text: "Temperature (°C)",
            style: {
              color: "#fb923c",
            }
          },
        },
        {
          seriesName: "Humidity",
          opposite: true,
          axisTicks: {
            show: true,
          },
          axisBorder: {
            show: true,
            color: "#0ea5e9"
          },
          labels: {
            style: {
              colors: "#0ea5e9",
            },
          },
          title: {
            text: "Humidity (%)",
            style: {
              color: "#0ea5e9",
            }
          },
        },
        {
          seriesName: "Rainfall",
          opposite: true,
          axisTicks: {
            show: true,
          },
          axisBorder: {
            show: true,
            color: "#c084fc"
          },
          labels: {
            style: {
              colors: "#c084fc",
            },
          },
          title: {
            text: "Rainfall (mm)",
            style: {
              color: "#c084fc",
            }
          },
        }
      ],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.2,
        opacityTo: 0.4,
      },
    },
    markers: {
      size: 5,
      colors: ["#f97316", "#0284c7", "#a855f7"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    grid: {
      borderColor: "#e7e7e7",
      strokeDashArray: 15,
      yaxis: {
        lines: {
          show: true,
          opacity: 0.3, // Adjusting opacity of y-axis lines
        },
      },
    },
  };

  if (!weatherData) {
    return (
      <Card className="h-full">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </Card>
    );
  }

  const chartSeries = [
    {
      name: "Temperature",
      data: weatherData.list.map(({ dt, temp }) => ({
        x: new Date(dt * 1000),
        y: Math.round((temp.day - 273.15)).toFixed(0),
      })),
    },
    {
        name: "Humidity",
        data: weatherData.list.map(({dt, humidity}) => ({
            x: new Date(dt * 1000),
            y: Math.round(humidity).toFixed(0)
        }))
    },
    {
        name: "Rainfall",
        data: weatherData.list.map(({ dt, rain }) => ({
            x: new Date(dt * 1000),
            y: rain ? parseFloat(rain).toFixed(1) : 0
          })),
    }
  ];
  return (
    <Card className="h-full">
        <Chart 
            options={chartOptions}
            type="area"
            height={500}
            series={chartSeries}
        />
    </Card>
  );
  
}

export default WeatherChart;
