// load data
d3.json("./assets/dump-small.json").then(function (data) {
    console.log(data);

    packages = data['packages']; // extract packages from data

    //let groupedPackages = packages.reduce((acc, val) => {
    //    acc[val.src_ip] = acc[val.src_ip] || [];
    //    acc[val.src_ip].push(val);
    //    return acc;
    //}, {});

    //let summedGroupedPackages = {};
    //for (let i in groupedPackages) {
    //    summedGroupedPackages[i] = groupedPackages[i].reduce((acc, val) => {
    //        let timestamp = Math.round(val.timestamp * 10);
    //        acc[timestamp] = acc[timestamp] || { packages: [], pkg_size: 0, timestamp: timestamp / 10 };
    //        acc[timestamp].packages.push(val);
    //        acc[timestamp].pkg_size += val.pkg_size;
    //        return acc;
    //    });
    //}

    //console.log(summedGroupedPackages);

    //let sumPkgSize = [];

    //let summedGroupedPackages = {};
    //for (let i in groupedPackages) {
    //    summedGroupedPackages[i] = {};
    //    groupedPackages[i].forEach((val) => {
    //        let timestamp = Math.round(val.timestamp * 10);
    //        summedGroupedPackages[i][timestamp] = summedGroupedPackages[i][timestamp] || { packages: [], pkg_size: 0, timestamp: timestamp / 10 };
    //        summedGroupedPackages[i][timestamp].packages.push(val);
    //        summedGroupedPackages[i][timestamp].pkg_size += val.pkg_size;
    //        sumPkgSize[timestamp] = sumPkgSize[timestamp] + val.pkg_size || val.pkg_size;
    //    });
    //}
    //console.log(summedGroupedPackages);

    let ips = {};

    let summedData = {};
    for (let i in packages) {
        let timestamp = Math.round(packages[i].timestamp * 10);
        summedData[timestamp] = summedData[timestamp] || { timestamp: timestamp / 10, total_pkg_size: 0 };
        summedData[timestamp][packages[i].src_ip] = summedData[timestamp][packages[i].src_ip] + packages[i].pkg_size || packages[i].pkg_size;
        summedData[timestamp].total_pkg_size += packages[i].pkg_size;
        ips[packages[i].src_ip] = 1;
    }

    summedData = Object.values(summedData); //required for the stack iterator
    console.log(summedData);

    let keys = Object.keys(ips);


    let margin = { top: 5, right: 5, bottom: 5, left: 5 },
        width = 800 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    // create traffic graph
    let svgContainer = d3
        .select("#traffic_overview")
        .append("svg")
        .attr("width", 800)
        .attr("height", 200)
        .style("border", "1px solid black");

    let g = svgContainer.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    let xscale = d3.scaleTime().range([0, width]);
    let yscale = d3.scaleLinear().range([0, height]);

    let xaxis = d3.axisTop().scale(xscale);
    let g_xaxis = g.append('g').attr('class', 'x axis');
    let yaxis = d3.axisLeft().scale(yscale);
    let g_yaxis = g.append('g').attr('class', 'y axis');

    let colors = d3.scaleOrdinal(d3.schemeCategory10);

    xscale.domain([d3.min(summedData, (d) => d.timestamp), d3.max(summedData, (d) => d.timestamp)]);
    yscale.domain([0, d3.max(summedData, (d) => d.total_pkg_size)]);
    colors.domain();

    g_xaxis.call(xaxis);
    g_yaxis.call(yaxis);

    let stack = d3.stack();

    let area = d3.area()
        .x((d, i) => xscale(d.data.timestamp))
        .y0((d) => yscale(d[0]))
        .y1((d) => yscale(d[1]));

    stack.keys(keys)

    let layer = g.selectAll('.layer')
        .data(stack(summedData));

    let layer_enter = layer.enter()
        .append('g').attr('class', 'layer');

    layer_enter.append('path')
        .attr('class', 'area')
        .style('fill', (d) => colors(d.key))
        .attr('d', area);

    layer_enter
        .append("text")
        .attr("x", width - 6)
        .attr("y", function (d) { return yscale((d[d.length - 1][0] + d[d.length - 1][1]) / 2); })
        .attr("dy", ".35em")
        .style("font", "10px sans-serif")
        .style("text-anchor", "end")
        .text(function (d) { return d.key; });

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xscale));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(yscale).ticks(1, "%"));
    
    // simply print some traffic informations to test d3js
    //d3.select("#traffic_overview")
    //    .selectAll("p")
    //    .data(packages)
    //    .enter()
    //    .append("p")
    //    .text(function (d, i) {
    //        console.log(d);
    //        console.log(i);
    //        return "pgk: " + d['src_ip'] + " -> " + d['dst_ip'];
    //    });



});
