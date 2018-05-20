// load data
d3.json("./assets/dump-small.json").then(function(data) {
    console.log(data);

    packages = data['packages']; // extract packages from data

    // create traffic graph
    let svgContainer = d3
        .select("#traffic_overview")
        .append("svg")
        .attr("width", 800)
        .attr("height", 200)
        .style("border", "1px solid black");

    // simply print some traffic informations to test d3js
    d3.select("#traffic_overview")
        .selectAll("p")
        .data(packages)
        .enter()
        .append("p")
        .text(function (d, i) {
            console.log(d);
            console.log(i);
            return "pgk: " + d['src_ip'] + " -> " + d['dst_ip'];
        });

});
