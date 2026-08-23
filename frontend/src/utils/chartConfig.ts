import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

// Register all required Chart.js components globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

// Dark theme defaults matching the dashboard aesthetic
ChartJS.defaults.color = '#9CA3AF';
ChartJS.defaults.borderColor = '#374151';
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

// Tooltip defaults
ChartJS.defaults.plugins.tooltip.backgroundColor = '#0c0c0e';
ChartJS.defaults.plugins.tooltip.borderColor = '#2a2a2a';
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.titleColor = '#9CA3AF';
ChartJS.defaults.plugins.tooltip.bodyColor = '#ffffff';
ChartJS.defaults.plugins.tooltip.padding = 12;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;

// Legend defaults
ChartJS.defaults.plugins.legend.labels.color = '#9CA3AF';
ChartJS.defaults.plugins.legend.labels.boxWidth = 10;
ChartJS.defaults.plugins.legend.labels.padding = 16;

export default ChartJS;
