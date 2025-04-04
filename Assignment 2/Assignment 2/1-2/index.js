console.log("hello World!") // We encourage you to utilize console.log frequently!



// sample data
const data = [
    { date: "2022-01-10", temperature: 28.4 },
    { date: "2022-01-04", temperature: 23.1 },
    { date: "2022-01-05", temperature: null },
    { date: "2022-01-08", temperature: 22.8 },
    { date: "2022-01-02", temperature: 24.2 },
    { date: null, temperature: 32.0 },
    { date: "2022-01-12", temperature: 23.9 },
    { date: "2022-01-14", temperature: 21.7 },
    { date: null, temperature: 25.1 },
    { date: "2022-01-18", temperature: 30.8 },
    { date: "2022-01-20", temperature: 29.6 },
    { date: "2022-01-01", temperature: 21.5 },
    { date: null, temperature: 26.7 },
    { date: "2022-01-09", temperature: null },
    { date: "2022-01-13", temperature: null },
    { date: "2022-01-07", temperature: 30.5 },
    { date: "2022-01-16", temperature: 27.3 },
    { date: "2022-01-03", temperature: null },
    { date: "2022-01-11", temperature: 32.0 },
    { date: "2022-01-17", temperature: null },
];


parsedData = data.map(d => {
    return { date: d3.timeParse("%Y-%m-%d")(d.date), temperature: d.temperature }
})

/*
-------------------------------------------------

Your Code Starts here!!
 
-------------------------------------------------
*/


/*
-------------------------------------------------

Your Code Ends here!!

-------------------------------------------------
*/

var margin = { top: 20, right: 30, bottom: 30, left: 60 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;


// generate SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");


// Set x,y axis
var x = d3.scaleTime().domain(d3.extent(filteredData, function (d) { return d.date })).range([0, width]);
var y = d3.scaleLinear().domain([20, d3.max(filteredData, function (d) { return d.temperature })]).range([height, 0]);

// Add the X Axis
svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .append('text')
    .attr('text-anchor', 'middle')
    .text('Date');

// Add the Y Axis
svg.append("g")
    .call(d3.axisLeft(y));

// Draw lines
svg.append("path")
    .datum(filteredData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
        .x(function (d) { return x(d.date) })
        .y(function (d) { return y(d.temperature) })
    )