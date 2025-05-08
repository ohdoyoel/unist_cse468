// Draw Kirby here!

let body = d3.select("body");

let svg = body
  .append("svg")
  .attr("width", 500)
  .attr("height", 500)
  .style("border", "1px solid black");

// Draw Kirby's arm
svg
  .append("ellipse")
  .attr("cx", 160)
  .attr("cy", 320)
  .attr("rx", 80)
  .attr("ry", 50)
  .attr("transform", "rotate(70, 250, 250)")
  .style("fill", "#ffb4dc")
  .style("stroke", "black")
  .style("stroke-width", 8);
svg
  .append("ellipse")
  .attr("cx", 320)
  .attr("cy", 180)
  .attr("rx", 80)
  .attr("ry", 50)
  .attr("transform", "rotate(50, 250, 250)")
  .style("fill", "#ffb4dc")
  .style("stroke", "black")
  .style("stroke-width", 8);

// Draw Kirby's leg
svg
  .append("ellipse")
  .attr("cx", 160)
  .attr("cy", 320)
  .attr("rx", 80)
  .attr("ry", 40)
  .attr("transform", "rotate(-30, 250, 250)")
  .style("fill", "#cf4f99")
  .style("stroke", "black")
  .style("stroke-width", 8);
svg
  .append("ellipse")
  .attr("cx", 340)
  .attr("cy", 320)
  .attr("rx", 80)
  .attr("ry", 40)
  .attr("transform", "rotate(30, 250, 250)")
  .style("fill", "#cf4f99")
  .style("stroke", "black")
  .style("stroke-width", 8);

// Draw Kirby's body
svg
  .append("circle")
  .attr("cx", 250)
  .attr("cy", 250)
  .attr("r", 120)
  .style("fill", "#ffb4dc")
  .style("stroke", "black")
  .style("stroke-width", 8);

// Draw Kirby's eyes
svg
  .append("ellipse")
  .attr("cx", 225)
  .attr("cy", 240)
  .attr("rx", 6)
  .attr("ry", 20)
  .style("fill", "black");
svg
  .append("ellipse")
  .attr("cx", 225)
  .attr("cy", 235)
  .attr("rx", 2)
  .attr("ry", 10)
  .style("fill", "white");

svg
  .append("ellipse")
  .attr("cx", 275)
  .attr("cy", 240)
  .attr("rx", 6)
  .attr("ry", 20)
  .style("fill", "black");
svg
  .append("ellipse")
  .attr("cx", 275)
  .attr("cy", 235)
  .attr("rx", 2)
  .attr("ry", 10)
  .style("fill", "white");

// Draw Kirby's mouth
svg
  .append("polygon")
  .attr("points", "240,270 260,270 250,290")
  .style("fill", "red")
  .style("stroke", "black")
  .style("stroke-width", 4);

// Draw Kirby's starrod from starrod.svg
d3.xml("starrod.svg").then((starrod) => {
  let g = svg.append("g").attr("transform", "rotate(60, 250, 250)");
  g.append(() => starrod.documentElement)
    .attr("width", 200)
    .attr("height", 200)
    .attr("x", -20)
    .attr("y", 150);
});
