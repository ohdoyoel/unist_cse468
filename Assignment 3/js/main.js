console.log("hello world!"); // You can see this in the browser console if you run the server correctly
// Don't edit skeleton code!!

d3.csv("data/owid-covid-data.csv")
  .then((data) => {
    /*
        -------------------------------------------
        YOUR CODE STARTS HERE

        TASK 1 - Data Processing 

        TO-DO-LIST
        1. Exclude data which contain missing values on columns you need
        2. Exclude data all data except the data where the continent is Asia 
        3. Calculate the rate of fully vaccinated people, partially vaccinated people, and total rate of vaccinated people
        4. Exclude data where total rate of vaccinated people is over 100%
        5. Exclude all data except the latest data for each country
        6. Sort the data with descending order by total reat of vaccinated people
        7. Extract Top 15 countries 
        -------------------------------------------
        */

    console.log(data);

    // 1. Exclude data which contain missing values on columns you need
    processedData = data.filter(
      (d) =>
        d.iso_code &&
        d.continent &&
        d.location &&
        d.date &&
        d.population &&
        d.people_vaccinated &&
        d.people_fully_vaccinated
    );
    console.log(processedData);

    // 2. Exclude data all data except the data where the continent is Asia
    processedData = processedData.filter((d) => d.continent === "Asia");
    console.log(processedData);

    // 3. Calculate the rate of fully vaccinated people, partially vaccinated people, and total rate of vaccinated people
    processedData = processedData.map((d) => ({
      ...d,
      _rate_people_fully_vaccinated:
        (d.people_fully_vaccinated / d.population) * 100,
      _rate_people_partially_vaccinated:
        ((d.people_vaccinated - d.people_fully_vaccinated) / d.population) *
        100,
      _rate_people_vaccinated: (d.people_vaccinated / d.population) * 100,
    }));
    console.log(processedData);

    // 4. Exclude data where total rate of vaccinated people is over 100%
    processedData = processedData.filter(
      (d) => d._rate_people_vaccinated <= 100
    );
    console.log(processedData);

    // 5. Exclude all data except the latest data for each country
    let latestDataByCountry = {};
    processedData.forEach((d) => {
      const iso = d.iso_code;
      const isExist = latestDataByCountry[iso];
      if (!isExist || latestDataByCountry[iso].date < d.date)
        latestDataByCountry[iso] = d;
    });
    processedData = Object.values(latestDataByCountry);
    console.log(processedData);

    // 6. Sort the data with descending order by total reat of vaccinated people
    processedData = processedData.sort(
      (a, b) => b._rate_people_vaccinated - a._rate_people_vaccinated
    );
    console.log(processedData);

    // 7. Extract Top 15 countries
    processedData = processedData.slice(0, 15);
    console.log(processedData);

    /*
        -------------------------------------------
        YOUR CODE ENDS HERE
        -------------------------------------------
        */

    drawBarChart(processedData);
  })
  .catch((error) => {
    console.error(error);
  });

function drawBarChart(data) {
  // Define the screen
  const margin = { top: 5, right: 30, bottom: 50, left: 120 },
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  // Define the position of the chart
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  /*
    -------------------------------------------
    YOUR CODE STARTS HERE

    TASK 2 - Data processing 

    TO-DO-LIST
    1. Create a scale named xScale for x-axis
    2. Create a scale named yScale for x-axis
    3. Define a scale named cScale for color
    4. Process the data for a stacked bar chart 
    5. Draw Stacked bars
    6. Draw the labels for bars
    -------------------------------------------
    */

  // 1. Create a scale for x-axis
  const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);

  // 2. Create a scale for y-axis
  const yScale = d3
    .scaleBand()
    .domain(data.map((d) => d.location))
    .range([0, height])
    .padding(0.1);

  // 3. Define a scale for color
  const cScale = d3.scaleOrdinal(
    ["_rate_people_fully_vaccinated", "_rate_people_partially_vaccinated"],
    ["#7bccc4", "#2b8cbe"]
  );

  // 4. Process the data for a stacked bar chart
  // * Hint - Try to utilze d3.stack()
  const stackedData = d3
    .stack()
    .keys([
      "_rate_people_fully_vaccinated",
      "_rate_people_partially_vaccinated",
    ])(data);
  console.log(stackedData);

  // 5.  Draw Stacked bars
  const group = svg
    .selectAll("g")
    .data(stackedData)
    .join("g")
    .attr("fill", (d) => cScale(d.key));

  group
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("y", (d) => yScale(d.data.location))
    .attr("x", (d) => xScale(d[0]))
    .attr("height", yScale.bandwidth())
    .attr("width", (d) => xScale(d[1]) - xScale(d[0]))
    .style("opacity", 0)
    .transition()
    .duration(750)
    .style("opacity", 1);

  // 6. Draw the labels for bars
  svg
    .selectAll("text.fully")
    .data(data)
    .join("text")
    .attr("class", "fully")
    .attr("x", (d) => xScale(d._rate_people_fully_vaccinated) - 5)
    .attr("y", (d) => yScale(d.location) + yScale.bandwidth() / 2 + 3)
    .text((d) => `${d._rate_people_fully_vaccinated.toFixed()}%`)
    .style("font-size", "10px")
    .style("text-anchor", "end");

  svg
    .selectAll("text.partially")
    .data(data)
    .join("text")
    .attr("class", "partially")
    .attr("x", (d) => xScale(d._rate_people_vaccinated) + 5)
    .attr("y", (d) => yScale(d.location) + yScale.bandwidth() / 2 + 3)
    .text((d) => `${d._rate_people_partially_vaccinated.toFixed()}%`)
    .style("font-size", "10px")
    .style("text-anchor", "start");

  /*
    -------------------------------------------
    YOUR CODE ENDS HERE
    -------------------------------------------
    */

  // Define the position of each axis
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  // Draw axes
  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .transition()
    .duration(750)
    .call(xAxis);

  svg
    .append("g")
    .attr("class", "y-axis")
    .transition()
    .duration(750)
    .call(yAxis);

  // Indicate the x-axis label
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + 40)
    .attr("font-size", 17)
    .text("Share of people (%)");

  // Draw Legend
  const legend = d3
    .select("#legend")
    .append("svg")
    .attr("width", width)
    .attr("height", 70)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", 18)
    .attr("width", 12)
    .attr("height", 12)
    .style("fill", "#7bccc4");
  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", 36)
    .attr("width", 12)
    .attr("height", 12)
    .style("fill", "#2b8cbe");
  legend
    .append("text")
    .attr("x", 18)
    .attr("y", 18)
    .text("The rate of fully vaccinated people")
    .style("font-size", "15px")
    .attr("text-anchor", "start")
    .attr("alignment-baseline", "hanging");
  legend
    .append("text")
    .attr("x", 18)
    .attr("y", 36)
    .text("The rate of partially vaccinated people")
    .style("font-size", "15px")
    .attr("text-anchor", "start")
    .attr("alignment-baseline", "hanging");
}
