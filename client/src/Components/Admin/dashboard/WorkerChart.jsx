import { Card } from "flowbite-react";
import { useState, useEffect } from "react";
import Chart from "react-apexcharts";

function WorkerChart({ workerStats }) {
    const [series, setSeries] = useState([]);

    useEffect(() => {
        if (workerStats && workerStats.length > 0) {
            const currentTime = new Date().getTime();

            setSeries(prevSeries => {
                // Create a new series for each worker, preserving existing data if available
                const newSeries = workerStats.map((worker, index) => {
                    const existingSeries = prevSeries[index] || { name: `Worker ${index + 1}`, data: [] };
                    const updatedData = [
                        ...existingSeries.data,
                        { x: currentTime, y: worker.rate }
                    ];
                    // Keep only the last 12 data points (60 seconds)
                    if (updatedData.length > 12) {
                        updatedData.shift();
                    }
                    return { ...existingSeries, data: updatedData };
                });

                return newSeries;
            });
        }
    }, [workerStats]);

    const chartOptions = {
        chart: {
            type: "area",
            toolbar: {
                show: false,
            },
            animations: {
                enabled: true,
                easing: 'linear',
                dynamicAnimation: {
                    speed: 1000
                }
            }
        },
        colors: ["#22C55E", "#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6"],
        xaxis: {
            type: "datetime",
            range: 60 * 1000, // 60 seconds
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
                    hour: "HH:mm:ss",
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
                formatter: function (value) {
                    return `${value.toFixed(2)}/s`;
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            curve: "smooth",
            width: 2,
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.4,
            },
        },
        markers: {
            size: 4,
            strokeColors: "#fff",
            strokeWidth: 2,
            hover: {
                size: 6,
            },
        },
        grid: {
            borderColor: "#e7e7e7",
            strokeDashArray: 10,
            yaxis: {
                lines: {
                    show: true,
                    opacity: 0.3,
                },
            },
        },
        legend: {
            show: true,
            position: 'bottom',
            horizontalAlign: 'center',
            floating: false,
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial',
            fontWeight: 400,
            formatter: function(seriesName, opts) {
                const lastValue = opts.w.globals.series[opts.seriesIndex][opts.w.globals.series[opts.seriesIndex].length - 1];
                return [seriesName, " - ", lastValue !== undefined ? lastValue.toFixed(2) : "0.00", "/s"];
            },
            itemMargin: {
                horizontal: 10,
                vertical: 5
            },
        },
    };

    return (
        <Card className="flex-grow">
            <h2 className="leading-none text-2xl font-bold text-gray-900 mb-4">Worker Stats</h2>
            <div id="worker-chart">
                <Chart
                    options={chartOptions}
                    series={series}
                    type="area"
                    height={400}
                />
            </div>
        </Card>
    );
}

export default WorkerChart;