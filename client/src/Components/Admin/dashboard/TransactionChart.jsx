import { Card, Spinner } from "flowbite-react";
import Chart from "react-apexcharts";
import { spinnerTheme } from "../../theme";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

function TransactionChart({ transactions, loading }) {
  const chartOptions = {
    chart: {
      type: "area",
      toolbar: {
        show: false,
      },
    },
    colors: ["#22C55E"],
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          fontSize: "15px",
          colors: ["#6B7280"],
          fontWeight: 350,
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
      tickAmount: 3,
      labels: {
        style: {
          fontSize: "15px",
          colors: ["#6B7280"],
          fontWeight: 550,
        },
        formatter: function (value) {
          return `$${value}`; // Adding $ symbol before the value
        },
      },
    },
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
        opacityFrom: 0.7,
        opacityTo: 0.9,
      },
    },
    markers: {
      size: 5,
      colors: ["#16A34A"],
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

  const groupTransactionsByDate = (transactions) => {
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const formattedDate = date.toISOString().split("T")[0];
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push(transaction);
      return acc;
    }, {});

    const chartData = Object.entries(groupedTransactions).map(
      ([date, transactions]) => ({
        x: new Date(date).getTime(),
        y: transactions.reduce((total, tx) => total + tx.amount, 0),
      })
    );
    return chartData;
  };

  const calculatePercentageChange = (data) => {
    if (data.length >= 2) {
      const startValue = data[data.length - 1].y;
      const endValue = data[0].y;
      const percentageChange = ((endValue - startValue) / startValue) * 100;
      return percentageChange.toFixed(2);
    }
    return 0;
  };

  const chartSeries = [
    {
      name: "Transaction",
      data: loading ? [] : groupTransactionsByDate(transactions.transactions),
    },
  ];

  const percentageChange = loading ? 0 : calculatePercentageChange(chartSeries[0].data);
  return (
    <Card>
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spinner theme={spinnerTheme} aria-label="Loading chart" />
        </div>
      ) : (
        <>
          <div className="flex flex-row justify-between w-full items-center">
            <div className="flex flex-col gap-3">
              <h2 className="leading-none text-3xl font-bold text-gray-900">
                {transactions.total.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </h2>
              <p className="text-base font-normal text-gray-500">
                Total transactions
              </p>
            </div>
            <div className="flex flex-row justify-between items-center gap-1">
                <span className={`font-semibold ${percentageChange > 0 ? 
                    'text-green-500' : percentageChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>{percentageChange}%</span>
                {percentageChange > 0 ? (<FaArrowUp className="w-4 h-4 text-green-500" />) 
                : percentageChange < 0 ? (<FaArrowDown className="w-4 h-4 text-red-500" />) 
                : (<></>)}
            </div>
          </div>
          <div id="area-chart">
            <Chart
              options={chartOptions}
              series={chartSeries}
              type="area"
              height={400}
            />
          </div>
        </>
      )}
    </Card>
  );
}

export default TransactionChart;
