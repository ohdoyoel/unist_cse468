const margin = { top: 50, right: 20, bottom: 50, left: 60 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

const container = d3
  .select("body")
  .append("div")
  .style("display", "flex")
  .style("align-items", "flex-start")
  .style("gap", "20px")
  .style("margin-top", "-20px");

const svg = container
  .append("svg")
  .attr("id", "chart")
  .attr(
    "viewBox",
    `0 0 ${width + margin.left + margin.right} ${
      height + margin.top + margin.bottom
    }`
  )
  .attr("preserveAspectRatio", "xMinYMin meet")
  .style("width", "100%")
  .style("height", "auto")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const filterPanel = container.append("div").attr("id", "filters");

// Load and preprocess data
d3.csv("chocolate_sales.csv").then((data) => {
  const parseDate = d3.timeParse("%d-%b-%y");

  data.forEach((d) => {
    d.Date = parseDate(d.Date);
    d.Amount = +d.Amount.replace(/[$,\s]/g, "");
    d.Month = d3.timeFormat("%Y-%m")(d.Date);
  });

  const nested = d3.rollups(
    data,
    (v) => d3.sum(v, (d) => d.Amount),
    (d) => d.Month,
    (d) => d.Product
  );

  const months = Array.from(new Set(data.map((d) => d.Month))).sort();
  const products = Array.from(new Set(data.map((d) => d.Product)));

  const stackedData = months.map((month) => {
    const entry = { month };
    products.forEach((p) => {
      entry[p] = 0;
    });
    const monthData = nested.find(([m]) => m === month);
    if (monthData) {
      monthData[1].forEach(([prod, val]) => {
        entry[prod] = val;
      });
    }
    return entry;
  });

  // Initial stack layout (full product order)
  const fullStack = d3.stack().keys(products);
  const initialSeries = fullStack(stackedData);

  const xScale = d3.scaleBand().domain(months).range([0, width]).padding(0.1);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(stackedData, (d) => d3.sum(products, (k) => d[k]))])
    .range([height, 0]);

  const color = d3
    .scaleOrdinal()
    .domain(products)
    .range(d3.quantize(d3.interpolateRainbow, products.length));

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale));

  const bars = svg
    .selectAll(".layer")
    .data(initialSeries, (d) => d.key)
    .join("g")
    .attr("class", "layer")
    .attr("fill", (d) => color(d.key));

  bars
    .selectAll("rect")
    .data((d) => d.map((v) => ({ ...v, key: d.key })))
    .join("rect")
    .attr("x", (d) => xScale(d.data.month))
    .attr("y", (d) => yScale(d[1]))
    .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .on("mouseover", (event, d) => {
      tooltip.transition().style("opacity", 1);
      tooltip
        .html(
          `<strong>${d.key}</strong><br>Month: ${d.data.month}<br>Sales: $${
            d[1] - d[0]
          }`
        )
        .style("left", event.pageX + 5 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().style("opacity", 0);
    });

  // Legend and filter controls
  const filters = filterPanel
    .append("ul")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("width", "220px")
    .style("gap", "6px")
    .style("list-style", "none")
    .style("padding", "0")
    .style("margin", "0");

  const activeProducts = new Set(products);

  const allLi = filters.append("li");
  const allLabel = allLi.append("label");
  allLabel
    .append("input")
    .attr("type", "checkbox")
    .attr("id", "all-toggle")
    .attr("checked", true)
    .on("change", function () {
      const check = this.checked;
      d3.selectAll(".product-toggle").property("checked", check);
      activeProducts.clear();
      if (check) products.forEach((p) => activeProducts.add(p));
      updateChart();
    });
  allLabel.append("span").text(" All Categories");

  products.forEach((prod) => {
    const li = filters.append("li");
    const label = li.append("label");
    label
      .append("input")
      .attr("type", "checkbox")
      .attr("class", "product-toggle")
      .attr("checked", true)
      .on("change", function () {
        if (this.checked) activeProducts.add(prod);
        else activeProducts.delete(prod);

        const allChecked = d3
          .selectAll(".product-toggle")
          .nodes()
          .every((cb) => cb.checked);
        d3.select("#all-toggle").property("checked", allChecked);

        updateChart();
      });
    label.append("span").text(" " + prod);
  });

  function updateChart() {
    const filteredKeys = products.filter((p) => activeProducts.has(p));
    const filteredStack = d3.stack().keys(products);

    const reorderedData = stackedData.map((d) => {
      const reordered = { ...d };
      products.forEach((p) => {
        if (!activeProducts.has(p)) reordered[p] = 0;
      });
      return reordered;
    });

    const newSeries = filteredStack(reorderedData);

    yScale.domain([
      0,
      d3.max(reorderedData, (d) => d3.sum(filteredKeys, (k) => d[k])) || 1,
    ]);

    svg.select(".y-axis").transition().duration(750).call(d3.axisLeft(yScale));

    const layer = svg.selectAll(".layer").data(newSeries, (d) => d.key);

    layer.exit().remove();

    const enterLayer = layer
      .enter()
      .append("g")
      .attr("class", "layer")
      .attr("fill", (d) => color(d.key));

    enterLayer
      .merge(layer)
      .selectAll("rect")
      .data((d) => d.map((v) => ({ ...v, key: d.key })))
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => xScale(d.data.month))
            .attr("y", yScale(0))
            .attr("height", 0)
            .attr("width", xScale.bandwidth())
            .call((enter) =>
              enter
                .transition()
                .delay((_, i) => i * 10)
                .attr("y", (d) => yScale(d[1]))
                .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
            ),
        (update) =>
          update.call((update) =>
            update
              .transition()
              .duration(750)
              .attr("x", (d) => xScale(d.data.month))
              .attr("y", (d) => yScale(d[1]))
              .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
          )
      );
  }
});
