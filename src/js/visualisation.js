/// ###########################################
/// ############ GLOBALS ######################
/// ###########################################

const dimensions = {
    trafficOverview: {
        margin: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 50
        },
        width: null,
        height: null,
        cellDuration: 20
    },
    timeSelectorOverview: {
        margin: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 50
        },
        width: null,
        height: null,
        cellDuration: 40,
        heightDivider: 5
    },
    timeSelector: {
        height: 20,
        handleRadius: 9
    },
	packageHistogram: {
		margin: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 50
        },
		height: 200,
        width: 500
    },
    packageProtocols: {
        margin: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 50
        },
        height: 200,
        width: 500,
        barPadding: 0.2
    }
};

const elements = {
    trafficOverview: {

    },
    timeSelectorOverview: {

    },
    timeSelector: {

    },
	packageHistogram: {

    },
    packageProtocols: {

    }
};

const model = {
    full: null,
    trafficOverview: {
        cells: null
    },
    timeSelector: {
        currentValueLeft: null,
        currentValueRight: null
    },
	packageHistogram: {
		minPackageSize: null,
		maxPackageSize: null
    },
    packageProtocols: {
        selectedProtocols: [],
        showSize: 1
    }
};

/// ###########################################
/// ############ INITIALIZERS #################
/// ###########################################

// load data
d3.json("./assets/dump.json").then(function (data) {
    console.log(data);
    model.full = data;

    updateDimensions();

    initTrafficOverview();
    initTimeSelectorOverview();
    initTimeSelector();
    initPackageHistogram();
    initPackageProtocols();
});

function initTrafficOverview() {
    // create traffic graph
    const eles = elements.trafficOverview;

    eles.svg = d3
        .select("#traffic_overview")
        .append("svg")
        .attr('width', dimensions.trafficOverview.width + dimensions.trafficOverview.margin.left + dimensions.trafficOverview.margin.right)
        .attr('height', dimensions.trafficOverview.height + dimensions.trafficOverview.margin.top + dimensions.trafficOverview.margin.bottom)
        .style("border", "1px solid black");

    eles.g = eles.svg.append("g")
        .attr("transform", `translate(${dimensions.trafficOverview.margin.left},${dimensions.trafficOverview.margin.top})`);

    eles.x = d3.scaleTime()
        .rangeRound([0, dimensions.trafficOverview.width]);
    eles.y = d3.scaleLinear()
        .rangeRound([dimensions.trafficOverview.height, 0]);

    eles.xaxis = d3.axisBottom().scale(eles.x);
    eles.g_xaxis = eles.g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${dimensions.trafficOverview.height})`);
    eles.yaxis = d3.axisLeft().scale(eles.y);
    eles.g_yaxis = eles.g.append('g').attr('class', 'y axis');

    updateTrafficOverview();
}

function initTimeSelectorOverview() {
    // create traffic graph
    const eles = elements.timeSelector;

    eles.svg = d3
        .select("#traffic_overview")
        .append("svg")
        .attr('width', dimensions.timeSelectorOverview.width + dimensions.timeSelectorOverview.margin.left + dimensions.timeSelectorOverview.margin.right)
        .attr('height', dimensions.timeSelectorOverview.height + dimensions.timeSelectorOverview.margin.top + dimensions.timeSelectorOverview.margin.bottom)
        .style("border", "1px solid black");

    eles.g = eles.svg.append("g")
        .attr("transform", `translate(${dimensions.timeSelectorOverview.margin.left},${dimensions.timeSelectorOverview.margin.top})`);

    eles.x = d3.scaleTime()
        .rangeRound([0, dimensions.timeSelectorOverview.width]);
    eles.y = d3.scaleLinear()
        .rangeRound([dimensions.timeSelectorOverview.height, 0]);

    eles.xaxis = d3.axisBottom().scale(eles.x);
    eles.g_xaxis = eles.g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${dimensions.timeSelectorOverview.height})`);
    eles.yaxis = d3.axisLeft().scale(eles.y);
    eles.g_yaxis = eles.g.append('g').attr('class', 'y axis');

    const cells = aggregatePackages(model.full.packages, dimensions.timeSelectorOverview.cellDuration);

    // draw graph
    eles.x.domain(d3.extent(cells, d => d.date));
    eles.y.domain([0, d3.max(cells, d => d.value)]);

    eles.g_xaxis.call(eles.xaxis);
    eles.g_yaxis.call(eles.yaxis);

    const line = d3.line()
        .x(d => eles.x(d.date))
        .y(d => eles.y(d.value));

    let path = eles.g.selectAll('.line')
        .data([cells]);

    let path_enter = path.enter()
        .append('path')
        .attr('class', 'line')
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5);

    path.merge(path_enter).transition()
        .attr('d', line);

    path.exit().remove();
}

function initTimeSelector() {
    let packets = model.full.packages;

    let interval_min = Math.min.apply(Math, packets.map(x => x.timestamp));
    let interval_max = Math.max.apply(Math, packets.map(x => x.timestamp));
    model.timeSelector.currentValueLeft = interval_min;
    model.timeSelector.currentValueRight = interval_max;

    const eles = elements.timeSelector;

    eles.x = d3.scaleTime()
        .rangeRound([0, dimensions.trafficOverview.width])
        .domain([interval_min, interval_max]);

    eles.svg = d3
        .select("#time_selector")
        .append("svg")
        .attr('width', dimensions.trafficOverview.width + dimensions.trafficOverview.margin.left + dimensions.trafficOverview.margin.right)
        .attr('height', dimensions.timeSelector.height + dimensions.trafficOverview.margin.top + dimensions.trafficOverview.margin.bottom);

    eles.slider = eles.svg.append("g")
        .attr("class", "slider")
        .attr("transform", `translate(${dimensions.trafficOverview.margin.left},${dimensions.trafficOverview.margin.top})`);

    eles.slider.append("line")
        .attr("class", "track")
        .attr("x1", eles.x.range()[0])
        .attr("x2", eles.x.range()[1])
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay");

    eles.xaxis = d3.axisBottom().scale(eles.x);
    eles.g_xaxis = eles.slider.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${dimensions.timeSelector.height})`);

    eles.g_xaxis.call(eles.xaxis);

    eles.handleLeft = eles.slider.insert("circle")
        .attr("class", "handle")
        .attr("r", dimensions.timeSelector.handleRadius)
        .call(d3.drag()
            .on("start.interrupt end", function () {
                eles.slider.interrupt();
                updateTrafficOverview();
                updatePackageHistogram();
                updatePackageProtocols();
            })
            .on("start drag", function () {
                const val = Math.min(Math.max(eles.x.invert(d3.event.x).getTime(), interval_min), model.timeSelector.currentValueRight);
                model.timeSelector.currentValueLeft = val;
                eles.handleLeft.attr("cx", eles.x(val));
            })
    );

    eles.handleRight = eles.slider.insert("circle")
        .attr("class", "handle")
        .attr("r", dimensions.timeSelector.handleRadius)
        .call(d3.drag()
            .on("start.interrupt end", function () {
                eles.slider.interrupt();
                updateTrafficOverview();
                updatePackageHistogram();
                updatePackageProtocols();
            })
            .on("start drag", function () {
                const val = Math.max(Math.min(eles.x.invert(d3.event.x).getTime(), interval_max), model.timeSelector.currentValueLeft);
                model.timeSelector.currentValueRight = val;
                eles.handleRight.attr("cx", eles.x(val));
            })
    );

    eles.handleLeft.attr("cx", eles.x(interval_min));
    eles.handleRight.attr("cx", eles.x(interval_max));
}

function initPackageHistogram() {
	let packets = model.full.packages;

    let package_size_min = Math.min.apply(Math, packets.map(x => x.pkg_size));
    let package_size_max = Math.max.apply(Math, packets.map(x => x.pkg_size));
    model.packageHistogram.minPackageSize = package_size_min;
	model.packageHistogram.maxPackageSize = package_size_max;
	
	const eles = elements.packageHistogram;
	
	eles.svg = d3
        .select("#package_histogram")
        .append("svg")
        .attr('width', dimensions.packageHistogram.width + dimensions.packageHistogram.margin.left + dimensions.packageHistogram.margin.right)
        .attr('height', dimensions.packageHistogram.height+ dimensions.packageHistogram.margin.top + dimensions.packageHistogram.margin.bottom)
        .style("border", "1px solid black");
	
	eles.g = eles.svg.append("g")
        .attr("transform", `translate(${dimensions.packageHistogram.margin.left},${dimensions.packageHistogram.margin.top})`);

    eles.x = d3.scaleLinear()
        .rangeRound([0, dimensions.packageHistogram.width]);
    eles.y = d3.scaleLinear()
        .rangeRound([dimensions.packageHistogram.height, 0]);

    eles.xaxis = d3.axisBottom().scale(eles.x);
    eles.g_xaxis = eles.g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${dimensions.packageHistogram.height})`);
    eles.yaxis = d3.axisLeft().scale(eles.y);
    eles.g_yaxis = eles.g.append('g').attr('class', 'y axis');

    eles.g_xaxis.call(eles.xaxis);

	updatePackageHistogram();
}

function initPackageProtocols() {
    const eles = elements.packageProtocols;

    eles.svg = d3
        .select("#package_protocols")
        .append("svg")
        .attr('width', dimensions.packageProtocols.width + dimensions.packageProtocols.margin.left + dimensions.packageProtocols.margin.right)
        .attr('height', dimensions.packageProtocols.height + dimensions.packageProtocols.margin.top + dimensions.packageProtocols.margin.bottom)
        .style("border", "1px solid black");
    
    eles.g = eles.svg.append("g")
        .attr("transform", `translate(${dimensions.packageProtocols.margin.left},${dimensions.packageProtocols.margin.top})`);

    eles.x = d3.scaleBand()
        .range([0, dimensions.packageProtocols.width]);
    eles.y = d3.scaleLinear()
        .rangeRound([dimensions.packageProtocols.height, 0]);

    eles.xaxis = d3.axisBottom().scale(eles.x);
    eles.g_xaxis = eles.g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${dimensions.packageProtocols.height})`);
    eles.yaxis = d3.axisLeft().scale(eles.y);
    eles.g_yaxis = eles.g.append('g').attr('class', 'y axis');

    eles.g_xaxis.call(eles.xaxis);

    d3.selectAll('[name="package_protocols_pkg"]').on('change', function () {
        model.packageProtocols.showSize = parseInt(d3.selectAll('[name="package_protocols_pkg"]:checked').attr('value'));
        updatePackageProtocols();
    })

    updatePackageProtocols();
}

/// ###########################################
/// ############ UPDATE FUNCTIONS #############
/// ###########################################

function updateDimensions() {
    dimensions.trafficOverview.width = 960 - dimensions.trafficOverview.margin.left - dimensions.trafficOverview.margin.right;
    dimensions.trafficOverview.height = 500 - dimensions.trafficOverview.margin.top - dimensions.trafficOverview.margin.bottom;
    dimensions.timeSelectorOverview.width = dimensions.trafficOverview.width;
    dimensions.timeSelectorOverview.height = Math.round(dimensions.trafficOverview.height / dimensions.timeSelectorOverview.heightDivider);
}

function updateTrafficOverview() {
    let packets = model.full.packages;
    if (model.timeSelector.currentValueRight && model.timeSelector.currentValueLeft) {
        packets = packets.filter(x => x.timestamp >= model.timeSelector.currentValueLeft && x.timestamp <= model.timeSelector.currentValueRight);
    }

    if (model.packageHistogram.minPackageSize && model.packageHistogram.maxPackageSize) {
        packets = packets.filter(x => x.pkg_size >= model.packageHistogram.minPackageSize && x.pkg_size <= model.packageHistogram.maxPackageSize);
    }

    if (model.packageProtocols.selectedProtocols.length > 0) {
        packets = packets.filter(x => model.packageProtocols.selectedProtocols.indexOf(x.protocol) >= 0);
    }
    
    model.trafficOverview.cells = aggregatePackages(packets, dimensions.trafficOverview.cellDuration);

    renderTrafficOverview();
}

function updatePackageHistogram() {
    let packets = model.full.packages;

    if (model.timeSelector.currentValueRight && model.timeSelector.currentValueLeft) {
        packets = packets.filter(x => x.timestamp >= model.timeSelector.currentValueLeft && x.timestamp <= model.timeSelector.currentValueRight);
    }

    if (model.packageProtocols.selectedProtocols.length > 0) {
        packets = packets.filter(x => model.packageProtocols.selectedProtocols.indexOf(x.protocol) >= 0);
    }

	let package_group_by_lambda = (map, size) => {
		if (!(size in map)) {
			map[size] = 1;
		} else {
			map[size] ++;
		}
		return map;
	}
	
    let package_sizes = packets.map(x => x.pkg_size).reduce(package_group_by_lambda, {});

	console.log(package_sizes);

	let package_size_min = Math.min.apply(Math, packets.map(x => x.pkg_size));
    let package_size_max = Math.max.apply(Math, packets.map(x => x.pkg_size));
	
	let cell_count = package_size_max - package_size_min;
	
	let cells = new Array(cell_count);
    for (let i = 0; i < cells.length; i++) {
        let size = i+package_size_min;
        cells[i] = {
            size: size,
            count: size in package_sizes ? package_sizes[size] : 0
        };
    }

    model.packageHistogram.cells = cells;
	
	renderPackageHistogram();
}

function updatePackageProtocols() {
    let packets = model.full.packages;

    if (model.timeSelector.currentValueRight && model.timeSelector.currentValueLeft) {
        packets = packets.filter(x => x.timestamp >= model.timeSelector.currentValueLeft && x.timestamp <= model.timeSelector.currentValueRight);
    }

    if (model.packageHistogram.minPackageSize && model.packageHistogram.maxPackageSize) {
        packets = packets.filter(x => x.pkg_size >= model.packageHistogram.minPackageSize && x.pkg_size <= model.packageHistogram.maxPackageSize);
    }

    let cells = packets.reduce((a, c) => {
        a[c.protocol] = a[c.protocol] || { protocol: c.protocol, value: 0 };
        a[c.protocol].value += model.packageProtocols.showSize ? c.pkg_size : 1;
        return a;
    }, {});

    model.packageProtocols.cells = Object.values(cells);

    renderPackageProtocols();
}

/// ###########################################
/// ############ RENDER FUNCTIONS #############
/// ###########################################

function renderTrafficOverview () {
    const eles = elements.trafficOverview;

    // draw graph
    eles.x.domain(d3.extent(model.trafficOverview.cells, d => d.date));
    eles.y.domain([0, d3.max(model.trafficOverview.cells, d => d.value)]);

    eles.g_xaxis.call(eles.xaxis);
    eles.g_yaxis.call(eles.yaxis);

    const line = d3.line()
        .x(d => eles.x(d.date))
        .y(d => eles.y(d.value));

    // TODO: enter/merge/exit?
    //eles.g.append("path")
    //    .datum(model.trafficOverview.cells)
    //    .attr("fill", "none")
    //    .attr("stroke", "black")
    //    .attr("stroke-linejoin", "round")
    //    .attr("stroke-linecap", "round")
    //    .attr("stroke-width", 1.5)
    //    .attr("d", line);

    let path = eles.g.selectAll('.line')
        .data([model.trafficOverview.cells]);

    let path_enter = path.enter()
        .append('path')
        .attr('class', 'line')
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5);

    path.merge(path_enter).transition()
        .attr('d', line);

    path.exit().remove();

}

function renderPackageHistogram() {
    const eles = elements.packageHistogram;

    // draw graph

    eles.x.domain([model.packageHistogram.cells[0].size, model.packageHistogram.cells[model.packageHistogram.cells.length - 1].size]);

    let histogram = d3.histogram()
        .value(function (d) {
            return d.size;
        })
        .domain(eles.x.domain())
        .thresholds(eles.x.ticks());

    let bins = histogram(model.packageHistogram.cells);

    eles.y.domain([0, d3.max(bins, function (d) { return d.reduce((a, c) => a + c.count, 0); })]);

    eles.g_xaxis.call(eles.xaxis);
    eles.g_yaxis.call(eles.yaxis);

    let bar = eles.g.selectAll("rect")
        .data(bins);

    let bar_enter = bar.enter()
        .append("rect")
        .attr("class", "bar")
        .attr('x', 1)
        .attr('width', 0)
        .attr('height', 0)
        .attr('data-min', (d) => d.x0)
        .attr('data-max', (d) => d.x1)
        .on('click', function () {
            const clicked = d3.select(this);
            if (clicked.classed('selected')) {
                model.packageHistogram.minPackageSize = null;
                model.packageHistogram.maxPackageSize = null;
                clicked.classed('selected', false);
            } else {
                model.packageHistogram.minPackageSize = parseFloat(clicked.attr('data-min'));
                model.packageHistogram.maxPackageSize = parseFloat(clicked.attr('data-max'));
                clicked.classed('selected', true);
            }
            updateTrafficOverview();
            updatePackageProtocols();
        });

    bar.merge(bar_enter).transition()
        .attr("transform", function (d) {
            return "translate(" + eles.x(d.x0) + "," + eles.y(d.reduce((a, c) => a + c.count, 0)) + ")";
        })
        .attr("width", function (d) {
            return eles.x(d.x1) - eles.x(d.x0) - 1;
        })
        .attr("height", function (d) {
            return dimensions.packageHistogram.height - eles.y(d.reduce((a, c) => a + c.count, 0));
        });

    bar.exit().remove();
}

function renderPackageProtocols() {
    const eles = elements.packageProtocols;

    eles.x.domain(model.packageProtocols.cells.map((d) => d.protocol));
    eles.y.domain([0, d3.max(model.packageProtocols.cells, (d) => d.value)]);

    eles.g_xaxis.call(eles.xaxis);
    eles.g_yaxis.call(eles.yaxis);

    const rect = eles.g.selectAll('rect')
        .data(model.packageProtocols.cells, (d) => d.protocol);

    const rect_enter = rect.enter().append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0)
        .on('click', function () {
            const clicked = d3.select(this);
            clicked.classed('selected', !clicked.classed('selected'));
            model.packageProtocols.selectedProtocols = [];
            eles.g.selectAll('.selected').each((d) => model.packageProtocols.selectedProtocols.push(d.protocol));
            updateTrafficOverview();
            updatePackageHistogram();
        });
    rect_enter.append('title');

    rect.merge(rect_enter).transition()
        .attr('height', (d) => dimensions.packageProtocols.height - eles.y(d.value))
        .attr('width', Math.round(eles.x.bandwidth()*(1-dimensions.packageProtocols.barPadding)))
        .attr('x', (d) => eles.x(d.protocol) + eles.x.bandwidth() * dimensions.packageProtocols.barPadding/2)
        .attr('y', (d) => eles.y(d.value));

    rect.merge(rect_enter).select('title').text((d) => d.protocol);

    rect.exit().remove();
}

/// ###########################################
/// ############ HELPER FUNCTIONS #############
/// ###########################################

function aggregatePackages(packets, cellDuration) {
    let interval_min = Math.min.apply(Math, packets.map(x => x.timestamp));
    let interval_max = Math.max.apply(Math, packets.map(x => x.timestamp));
    let duration = interval_max - interval_min;

    // aggregate troughput
    let cell_count = Math.ceil(duration / cellDuration);

    if (Math.ceil(interval_min) == Math.ceil(interval_max)) {
        cell_count = 1;
    }

    let cells = new Array(cell_count);
    for (let i = 0; i < cells.length; i++) {
        let begin = Math.floor(interval_min);
        cells[i] = {
            begin: begin + i * cellDuration,
            end: begin + (i + 1) * cellDuration,
            center: begin + (i + 0.5) * cellDuration,
            date: new Date((begin + (i + 0.5) * cellDuration) * 1000),
            value: 0
        };
    }

    let last = 0;
    for (let i = 0; i < cell_count; i++) {
        cells[i].value = 0;
        for (let j = last; j < packets.length; j++) {
            let packet = packets[j];
            if (packet.timestamp >= cells[i].end) {
                break;
            } else {
                last = j;
                cells[i].value += packet.pkg_size;
            }
        }
    }

    cells[0].begin = interval_min;
    cells[cell_count - 1].end = interval_max;

    for (let i = 0; i < cells.length; i++) {
        cells[i].value /= (cells[i].end - cells[i].begin); // normalize to bytes/sec
    }

    console.log(cells);
    return cells;
}