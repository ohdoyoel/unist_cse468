// State management for cross-component communication
const appState = {
  timeRange: null,
  selectedProduct: null,
  selectedRows: [],
  updateTimeRange(range) {
    this.timeRange = range;
    this.notifyVisualizations();
  },
  updateSelectedProduct(product) {
    this.selectedProduct = product;
    this.notifyVisualizations();
  },
  updateSelectedRows(rows) {
    this.selectedRows = rows;
    this.notifyVisualizations();
  },
  notifyVisualizations() {
    updateAreaChart(this);
    updateBarChart(this);
    updateDataTable(this);
  },
};

let rawData = [];

// Load data and initialize visualizations
d3.csv("chocolate_sales.csv").then((data) => {
  rawData = data; // Store raw data for later use
  // Data preprocessing
  data.forEach((d) => {
    d.Date = d3.timeParse("%d-%b-%y")(d.Date); // Parse date
    d.Amount = +d.Amount.replace(/[$,]/g, ""); // Parse amount as a number
    d["Boxes Shipped"] = +d["Boxes Shipped"]; // Parse boxes shipped as a number
  });

  // Debugging: Log the parsed data to ensure correctness
  console.log("Parsed Data:", data);

  // Initialize visualizations
  createDataTable(data);
  createAreaChart(data);
  createBarChart(data);

  // Add reset button functionality
  d3.select("#reset-button").on("click", () => {
    appState.updateTimeRange(null);
    appState.updateSelectedProduct(null);
    appState.updateSelectedRows([]);
  });
});

// Create the interactive datatable
function createDataTable(data) {
  const table = d3
    .select("#data-table")
    .append("table")
    .attr("class", "datatable");
  const thead = table.append("thead");
  const tbody = table.append("tbody");

  // Define columns
  const columns = [
    "Sales Person",
    "Country",
    "Product",
    "Date",
    "Amount",
    "Boxes Shipped",
  ];

  // Create table headers with sorting and filtering
  const headerCells = thead
    .append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
    .html((d) => `${d} <span class="sort-arrow"></span>`) // Add a span for the sort arrow
    .on("click", (event, column) => {
      const ascending = !d3.select(event.target).classed("ascending");
      d3.selectAll("th")
        .classed("ascending", false)
        .classed("descending", false)
        .select(".sort-arrow")
        .text(""); // Clear all arrows
      d3.select(event.target)
        .classed(ascending ? "ascending" : "descending", true)
        .select(".sort-arrow")
        .text(ascending ? "▲" : "▼"); // Add the appropriate arrow
      const sortedData = data.sort((a, b) =>
        ascending
          ? d3.ascending(a[column], b[column])
          : d3.descending(a[column], b[column])
      );
      updateDataTableRows(
        sortedData.slice(
          currentPage * rowsPerPage,
          (currentPage + 1) * rowsPerPage
        )
      );
    });

  // Add filter inputs below each header
  const filterRow = thead
    .append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
    .each(function (column) {
      if (["Date", "Amount", "Boxes Shipped"].includes(column)) {
        // Add search input for specific columns
        d3.select(this)
          .append("input")
          .attr("type", "text")
          .attr("placeholder", `Search ${column}`)
          .style("width", "100%")
          .on("input", function () {
            const searchValue = d3.select(this).property("value").toLowerCase();
            const filteredData = data.filter((d) =>
              d[column].toString().toLowerCase().includes(searchValue)
            );
            updateDataTableRows(
              filteredData.slice(
                currentPage * rowsPerPage,
                (currentPage + 1) * rowsPerPage
              )
            );
            updatePaginationControls(filteredData); // Update pagination for filtered data
          });
      } else {
        // Add dropdown for other columns
        const uniqueValues = Array.from(new Set(data.map((d) => d[column])));
        uniqueValues.unshift("All"); // Add "All" option
        d3.select(this)
          .append("select")
          .attr("class", "filter-dropdown")
          .style("width", "100%")
          .on("change", function () {
            const selectedValue = d3.select(this).property("value");
            const filteredData =
              selectedValue === "All"
                ? data
                : data.filter((d) => d[column] === selectedValue);
            updateDataTableRows(
              filteredData.slice(
                currentPage * rowsPerPage,
                (currentPage + 1) * rowsPerPage
              )
            );

            updatePaginationControls(filteredData); // Update pagination for filtered data
          })
          .selectAll("option")
          .data(uniqueValues)
          .enter()
          .append("option")
          .text((d) => d);
      }
    });

  // Pagination variables
  const rowsPerPage = 10;
  let currentPage = 0;

  // Store column widths globally to ensure consistency
  let columnWidths = [];

  // Populate table rows
  function updateDataTableRows(filteredData) {
    const rows = tbody.selectAll("tr").data(filteredData, (d) => d.Product);
    rows.exit().remove();

    // Calculate column widths only once
    if (columnWidths.length === 0) {
      columnWidths = headerCells
        .nodes()
        .map((header) => header.getBoundingClientRect().width);
    }

    const newRows = rows
      .enter()
      .append("tr")
      .on("click", (event, d) => {
        appState.updateSelectedRows([d]);
      });

    newRows
      .merge(rows)
      .selectAll("td")
      .data((row) =>
        columns.map((col) =>
          col === "Date" ? d3.timeFormat("%Y. %m. %d")(row[col]) : row[col]
        )
      )
      .join("td")
      .style("width", (d, i) => `${columnWidths[i]}px`) // Apply consistent column widths
      .text((d) => d);
  }

  // Update pagination controls to handle filtered data
  function updatePaginationControls(filteredData = data) {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const maxVisiblePages = 7; // Maximum number of visible pages around the current page
    d3.select("#pagination-controls").remove();

    const paginationContainer = d3
      .select("#data-table")
      .append("div")
      .attr("id", "pagination-controls")
      .style("position", "relative") // Allow absolute centering of child elements
      .style("height", "30px") // Set a fixed height for proper centering
      .style("margin-top", "10px");

    // Add "Showing X to Y of Z entries" text
    paginationContainer
      .append("div")
      .attr("class", "pagination-info")
      .text(() => {
        const start = currentPage * rowsPerPage + 1;
        const end = Math.min(
          (currentPage + 1) * rowsPerPage,
          filteredData.length
        );
        return `Showing ${start} to ${end} of ${filteredData.length} entries`;
      })
      .style("position", "absolute")
      .style("top", "0")
      .style("left", "0");

    // Pagination buttons container
    const paginationWrapper = paginationContainer
      .append("div")
      .attr("class", "pagination-wrapper")
      .style("position", "absolute")
      .style("top", "50%")
      .style("left", "50%")
      .style("transform", "translate(-50%, -50%)") // Center the wrapper
      .style("display", "flex")
      .style("align-items", "center");

    // Generate pagination buttons
    const visiblePages = getVisiblePages(currentPage + 1, totalPages); // currentPage is 0-based

    paginationWrapper
      .selectAll("button.page-btn")
      .data(visiblePages)
      .enter()
      .append("button")
      .attr("class", "page-btn")
      .text((d) => (typeof d === "number" ? d : "..."))
      .style("margin", "0 5px")
      .style("padding", "5px 10px")
      .style("width", "40px") // Ensure all buttons have the same width
      .style("cursor", (d) => (d < 1 || d > totalPages ? "default" : "pointer"))
      .style("opacity", (d) =>
        typeof d === "number" && (d < 1 || d > totalPages) ? "0" : "1"
      ) // Make invalid pages semi-transparent
      .attr("disabled", (d) =>
        typeof d === "number" && (d < 1 || d > totalPages) ? true : null
      )
      .classed("active", (d) => d === currentPage + 1) // Highlight the active page
      .style("background-color", (d) =>
        d === currentPage + 1 ? "#007bff" : ""
      )
      .style("color", (d) => (d === currentPage + 1 ? "#fff" : ""))
      .on("click", (event, page) => {
        if (typeof page === "number" && page >= 1 && page <= totalPages) {
          currentPage = page - 1; // Convert to 0-based index
          updateDataTableRows(
            filteredData.slice(
              currentPage * rowsPerPage,
              (currentPage + 1) * rowsPerPage
            )
          );
          updatePaginationControls(filteredData);
        }
      });

    // Helper function to calculate visible pages
    function getVisiblePages(currentPage, totalPages) {
      const pages = [];
      const halfRange = Math.floor(maxVisiblePages / 2);

      let startPage = currentPage - halfRange;
      let endPage = currentPage + halfRange;

      if (currentPage > halfRange + 1) {
        pages.push(1);
        pages.push("...");
      } else {
        pages.push(0);
        pages.push(0);
      }
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (currentPage < totalPages - halfRange) {
        pages.push("...");
        pages.push(totalPages);
      } else {
        pages.push(0);
        pages.push(0);
      }

      return pages;
    }
  }

  updateDataTableRows(data.slice(0, rowsPerPage));
  updatePaginationControls();
}

function createAreaChart(data) {
  const margin = { top: 20, right: 15, bottom: 60, left: 45 };
  const ctxMargin = { top: 20, right: 15, bottom: 20, left: 45 };

  const parentElement = d3.select("#area-chart");
  const parentWidth = parentElement.node().clientWidth;
  const parentHeight = 400;

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight * 0.7 - margin.top - margin.bottom);
  const ctxHeight = Math.max(
    0,
    parentHeight * 0.3 - ctxMargin.top - ctxMargin.bottom
  );

  // Step 1: Aggregate sales amounts by date
  const aggregatedData = d3
    .rollups(
      data,
      (v) => d3.sum(v, (d) => d.Amount),
      (d) => d.Date
    )
    .map(([date, total]) => ({ Date: date, Total: total }));

  // Step 2: Filter out invalid data points
  const validData = aggregatedData.filter((d) => d.Date && !isNaN(d.Total));

  // Step 3: Fill missing dates with 0 Total
  const allDates = d3.timeDay.range(
    d3.min(validData, (d) => d.Date),
    d3.max(validData, (d) => d.Date)
  );

  const dataMap = new Map(validData.map((d) => [d.Date.getTime(), d.Total]));
  const filledData = allDates.map((date) => ({
    Date: date,
    Total: dataMap.get(date.getTime()) || 0,
  }));

  // Scales
  const x = d3
    .scaleTime()
    .domain(d3.extent(filledData, (d) => d.Date))
    .range([0, width]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(filledData, (d) => d.Total)])
    .nice()
    .range([height, 0]);

  const ctxX = x.copy();
  const ctxY = d3.scaleLinear().domain(y.domain()).range([ctxHeight, 0]);

  // Area generators
  const areaGen = d3
    .area()
    .x((d) => x(d.Date))
    .y0(height)
    .y1((d) => y(d.Total));

  const ctxAreaGen = d3
    .area()
    .x((d) => ctxX(d.Date))
    .y0(ctxHeight)
    .y1((d) => ctxY(d.Total));

  // Combine into a single SVG
  const totalHeight = height + ctxHeight + margin.top + ctxMargin.bottom + 30;
  const svg = parentElement
    .append("svg")
    .attr(
      "viewBox",
      `0 0 ${width + margin.left + margin.right} ${totalHeight}`
    );

  // Main chart group
  const mainGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  mainGroup
    .append("path")
    .datum(filledData)
    .attr("fill", "#69b3a2")
    .attr("d", areaGen.y1(height)) // 시작: 모두 바닥(y0=y1)
    .transition()
    .duration(1000)
    .attr(
      "d",
      areaGen.y1((d) => y(d.Total))
    ); // 끝: 실제 값으로 y1 이동

  mainGroup
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  mainGroup
    .append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).ticks(6, "s"));

  // Context chart group
  const ctxGroup = svg
    .append("g")
    .attr(
      "transform",
      `translate(${ctxMargin.left}, ${margin.top + height + 30})`
    );

  ctxGroup
    .append("path")
    .datum(filledData)
    .attr("fill", "#a8d5ba")
    .attr("d", ctxAreaGen);

  ctxGroup
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${ctxHeight})`)
    .call(d3.axisBottom(ctxX).ticks(width < 500 ? 4 : 8));

  // Brush
  const brush = d3
    .brushX()
    .extent([
      [0, 0],
      [width, ctxHeight],
    ])
    .on("end", handleBrush);

  ctxGroup.append("g").attr("class", "brush").call(brush);

  function zoom(newXDomain) {
    x.domain(newXDomain);
    mainGroup.select("path").transition().duration(600).attr("d", areaGen);
    mainGroup
      .select(".x-axis")
      .transition()
      .duration(600)
      .call(d3.axisBottom(x).tickSizeOuter(0));
  }

  function handleBrush({ selection }) {
    if (!selection) return;
    const [x0, x1] = selection.map(ctxX.invert);
    appState.updateTimeRange([x0, x1]);
    zoom([x0, x1]);
  }
  createAreaChart.zoom = zoom;
}

// Create the stacked bar chart
function createBarChart(data) {
  const margin = { top: 40, right: 30, bottom: 70, left: 60 };
  const parentElement = d3.select("#bar-chart");
  const width = parentElement.node().clientWidth - margin.left - margin.right;
  const height = 300;

  const svg = parentElement
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const xScale = d3.scaleBand().range([0, width]).padding(0.2);
  const yScale = d3.scaleLinear().range([height, 0]);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const categories = Array.from(new Set(data.map((d) => d.Product)));
  const categoryData = categories.map((category) => ({
    category,
    total: d3.sum(
      data.filter((d) => d.Product === category),
      (d) => d.Amount
    ),
  }));

  xScale.domain(categories);
  yScale.domain([0, d3.max(categoryData, (d) => d.total)]);

  const color = d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10);

  g.selectAll(".bar")
    .data(categoryData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.category))
    .attr("y", height)
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .attr("fill", (d) => color(d.category))
    .style("opacity", (d) =>
      appState.selectedProduct && appState.selectedProduct !== d.category
        ? 0.4
        : 1
    )
    .on("click", (event, d) => {
      appState.updateSelectedProduct(d.category);
    })
    .attr("y", (d) => yScale(d.total))
    .attr("height", (d) => height - yScale(d.total))
    .selection()
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(300)
        .attr("fill", d3.color(color(d.category)).darker(1));
    })
    .on("mouseout", function (event, d) {
      d3.select(this)
        .transition()
        .duration(300)
        .attr("fill", color(d.category));
    });

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end")
    .style("font-size", "12px");

  g.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale).ticks(6))
    .selectAll("text")
    .style("font-size", "12px");

  svg
    .append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Sales Amount by Product");

  svg
    .append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", height + margin.top + 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Product");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 15)
    .attr("x", -(margin.top + height / 2))
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Amount ($)");
}

function updateAreaChart(state) {
  const filteredData = rawData.filter((d) => {
    const inProductRange =
      !state.selectedProduct || d.Product === state.selectedProduct;
    return inProductRange;
  });

  // Remove the existing chart
  d3.select("#area-chart svg").remove();

  // Recreate the area chart with filtered data
  createAreaChart(filteredData);

  // Reapply the zoom functionality
  if (state.timeRange) {
    createAreaChart.zoom(state.timeRange);
  }
}

function updateBarChart(state) {
  const filteredData = rawData.filter((d) => {
    return (
      !state.timeRange ||
      (d.Date >= state.timeRange[0] && d.Date <= state.timeRange[1])
    );
  });
  d3.select("#bar-chart svg").remove();
  createBarChart(filteredData);
}

function updateDataTable(state) {
  const filteredData = rawData.filter((d) => {
    const inTimeRange =
      !state.timeRange ||
      (d.Date >= state.timeRange[0] && d.Date <= state.timeRange[1]);
    const inSalesPersonRange =
      !state.selectedSalesPerson ||
      d["Sales Person"] === state.selectedSalesPerson;
    const inCountryRange =
      !state.selectedCountry || d.Country === state.selectedCountry;
    const inProductRange =
      !state.selectedProduct || d.Product === state.selectedProduct;
    return (
      inTimeRange && inSalesPersonRange && inCountryRange && inProductRange
    );
  });
  d3.select("#data-table table").remove();
  d3.select("#pagination-controls").remove();
  createDataTable(filteredData);
}
