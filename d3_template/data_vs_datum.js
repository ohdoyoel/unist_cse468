// const data = [10, 20, 30];

// d3.select("svg")
//   .selectAll("circle")
//   .data(data) // 데이터 3개 → 요소 3개 바인딩
//   .join("circle")
//   .attr("r", (d) => d); // d는 각각 10, 20, 30

// const data = [
//   { x: 0, y: 0 },
//   { x: 10, y: 20 },
//   { x: 30, y: 40 },
// ];

// d3.select("svg")
//   .append("path")
//   .datum(data) // 전체 배열 1개를 path 하나에 바인딩
//   .attr(
//     "d",
//     d3
//       .line()
//       .x((d) => d.x)
//       .y((d) => d.y)
//   );
