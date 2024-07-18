import { Card } from "flowbite-react";
import Chart from "react-apexcharts";

function MetricsCard({ metrics }) {

    const chartConfig = (title, data, color) => ({
        options: {
          chart: {
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false }
          },
          title: { text: title, style: { fontSize: '16px', fontWeight: 'bold', color: '#1f2937' } },
          xaxis: {
            type: 'numeric',
            title: { text: 'Step', style: { color: '#6b7280' } },
            labels: { 
                style: { colors: '#6b7280' },
                formatter: (value) => Math.round(value)
            }
          },
          yaxis: {
            title: { text: 'Value', style: { color: '#6b7280' } },
            labels: { 
                style: { colors: '#6b7280' },
                formatter: (value) => value.toFixed(2)
            }
          },
          colors: [color],
          stroke: { curve: 'smooth', width: 2 },
          fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3, stops: [0, 100] }
          },
          dataLabels: { enabled: false },
          tooltip: { 
            theme: 'light',
            y: {
                formatter: (value) => value.toFixed(2)
            }
        }
        },
        series: [{ name: title, data: data }]
      });

  if (metrics === null) {
    return (
      <div className="grid md:grid-cols-2 gap-5 grid-cols-1">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded rounded-lg"></div>
          </Card>
        ))}
      </div>
    );
  }

  const charts = [
    { title: 'Precision', data: metrics.precision, color: '#10B981' },
    { title: 'Box Loss', data: metrics.box_loss, color: '#8b5cf6' },
    { title: 'Recall', data: metrics.recall, color: '#0ea5e9' },
    { title: 'mAP50', data: metrics.map50, color: '#F59E0B' }
  ];
  return (
    <div className="grid md:grid-cols-2 gap-5 grid-cols-1">
      {charts.map(({ title, data, color }) => (
        <Card key={title}>
          <Chart
            options={chartConfig(title, data, color).options}
            series={chartConfig(title, data, color).series}
            type="area"
            height={300}
          />
        </Card>
      ))}
    </div>
  );
}

export default MetricsCard;
