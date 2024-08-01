import { Card } from "flowbite-react";
import { useMemo } from "react";
import Chart from "react-apexcharts";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

function HistoricalChart({ forecastData, historicalData }) {
  const forecastEndDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date;
  })

  const toolTipForecast = (
    <div class="custom-tooltip p-2 bg-white border border-gray-200 rounded shadow-lg max-w-xs">
      <div class="text-sm text-gray-500 mt-2">
      hello
      </div>
    </div>
  )

  const chartOptions = {
    chart: {
      toolbar: {
        show: false,
      },
    },
    colors: ["#22C55E", "#34d399", "#60a5fa", "#fb7185"],
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          fontSize: "15px",
          colors: ["#6B7280"],
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
    yaxis: {
      show: true,
      tickAmount: 4,
      labels: {
        style: {
          fontSize: "15px",
          colors: ["#6B7280"],
          fontWeight: 550,
        },
        formatter: (value) => Math.round(value),
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: ['smooth', 'straight', "straight", "straight"],
      width: [4, 2, 2, 2],
      dashArray: [0, 14, 14, 14]
    },
    fill: {
      type: ["gradient", "solid"],
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
      },
    },
    markers: {
      size: 5,
      colors: ["#16A34A", "#10b981", "#3b82f6", "#f43f5e"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    grid: {
      borderColor: "#e7e7e7",
      strokeDashArray: 10,
      yaxis: {
        lines: {
          show: true,
          opacity: 0.3, // Adjusting opacity of y-axis lines
        },
      },
    },
  };

  let chartSeries = [];

  if (forecastData === null) {
    chartSeries = [
      {
        name: "Tassel Count",
        type: "area",
        data: historicalData.date_count.map(({ date, total_tassel_count }) => ({
          x: date,
          y: total_tassel_count,
        })),
      }
    ]
  } else {
    chartSeries = [
      {
        name: "Tassel Count",
        type: "area",
        data: historicalData.date_count.map(({ date, total_tassel_count }) => ({
          x: date,
          y: total_tassel_count,
        })),
      },
      {
        name: "Max Forecast",
        type: "line",
        data: [
          { x : historicalData.date_count[historicalData.date_count.length - 1].date, y: historicalData.date_count[historicalData.date_count.length - 1].total_tassel_count },
          { x: forecastEndDate.getTime(), y: historicalData.date_count[historicalData.date_count.length - 1].total_tassel_count * (1+forecastData.max_change) },
        ],
      },
      {name: "Avg Forecast",
       type: "line",
       data: [
        { x : historicalData.date_count[historicalData.date_count.length - 1].date, y: historicalData.date_count[historicalData.date_count.length - 1].total_tassel_count },
        { x: forecastEndDate.getTime(), y: historicalData.date_count[historicalData.date_count.length - 1].total_tassel_count * (1+forecastData.avg_change) },
       ]
      },
      {
        name: "Min Forecast",
        type: "line",
        data: [
        { x : historicalData.date_count[historicalData.date_count.length - 1].date, y: historicalData.date_count[historicalData.date_count.length - 1].total_tassel_count },
        { x: forecastEndDate.getTime(), y: historicalData.date_count[historicalData.date_count.length - 1].total_tassel_count * (1+forecastData.min_change)}
        ]
      }
    ];
  }

  return (
    <Card>
      <div className="w-full flex flex-row justify-between items-center">
        <div>
          <h2 className="leading-none text-3xl font-extrabold text-gray-900">
            {historicalData.total}
          </h2>
          <p className="mt-2 text-base font-normal text-gray-500">
            Total tassel
          </p>
        </div>
        <div className="flex flex-row justify-between items-center gap-1">
          <span
            className={`font-semibold ${
              historicalData.percentage_change > 0
                ? "text-green-500"
                : historicalData.percentage_change < 0
                ? "text-red-500"
                : "text-gray-500"
            }`}
          >
            {historicalData.percentage_change}%
          </span>
          {historicalData.percentage_change > 0 ? (
            <FaArrowUp className="w-4 h-4 text-green-500" />
          ) : historicalData.percentage_change < 0 ? (
            <FaArrowDown className="w-4 h-4 text-red-500" />
          ) : (
            <></>
          )}
        </div>
      </div>
      <div id="area-chart">
        <Chart
          options={chartOptions}
          type="area"
          height={400}
          series={chartSeries}
        />
      </div>
    </Card>
  );
}

export default HistoricalChart;
