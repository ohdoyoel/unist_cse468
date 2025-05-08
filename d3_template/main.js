// Sample data
const data = [
  { category: "A", value1: 10, value2: 20, value3: 30 },
  { category: "B", value1: 15, value2: 25, value3: 35 },
  { category: "C", value1: 8, value2: 18, value3: 28 },
];

// Stack generator
const stack = d3.stack().keys(["value1", "value2", "value3"]);

// Apply stack layout to the data
const stackedData = stack(data);

// Create scales for x and y axes
const xScale = d3
  .scaleBand()
  .domain(data.map((d) => d.category))
  .range([0, 400])
  .padding(0.1);

const yScale = d3
  .scaleLinear()
  .domain([0, d3.max(stackedData, (d) => d3.max(d, (d) => d[1]))])
  .range([200, 0]);

// Create SVG element
const svg = d3.select("#chart");

// Create groups for each stacked bar
const groups = svg
  .selectAll("g")
  .data(stackedData)
  .join("g")
  .attr("fill", (d, i) => `hsl(${i * 40}, 70%, 50%)`);

// HSL stands for Hue, Saturation, and Lightness. It is a color model that represents colors based on these three components.hsl(${i * 40}, 70%, 50%) is used to generate different hues for each stacked bar in the chart. The i * 40 part dynamically calculates the hue value based on the index of the stacked bar, while 70% and 50% represent fixed values for saturation and lightness, respectively.

// Create stacked bars within each group
groups
  .selectAll("rect")
  .data((d) => d)
  .join("rect")
  .attr("x", (d, i) => xScale(data[i].category))
  .attr("y", (d) => yScale(d[1]))
  .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
  .attr("width", xScale.bandwidth());

// Add x and y axes
const xAxis = d3.axisBottom(xScale);
svg.append("g").attr("transform", "translate(0, 200)").call(xAxis);

const yAxis = d3.axisLeft(yScale);
svg.append("g").call(yAxis);
