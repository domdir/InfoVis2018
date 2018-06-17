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
        cellDuration: 40
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
	
	initPackageHistogram()
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
	
    eles.x = d3.scaleLinear()
        .rangeRound([dimensions.packageHistogram.width, 0]);
    eles.y = d3.scaleLinear()
        .rangeRound([dimensions.packageHistogram.height, 0]);
	
	eles.g = eles.svg.append("g")
        .attr("transform", `translate(${dimensions.packageHistogram.margin.left},${dimensions.packageHistogram.margin.top})`);

    eles.x = d3.scaleTime()
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

/// ###########################################
/// ############ UPDATE FUNCTIONS #############
/// ###########################################

function updateDimensions() {
    dimensions.trafficOverview.width = 960 - dimensions.trafficOverview.margin.left - dimensions.trafficOverview.margin.right;
    dimensions.trafficOverview.height = 500 - dimensions.trafficOverview.margin.top - dimensions.trafficOverview.margin.bottom;
    dimensions.timeSelectorOverview.width = dimensions.trafficOverview.width;
    dimensions.timeSelectorOverview.height = Math.round(dimensions.trafficOverview.height / 3);
}

function updateTrafficOverview() {
    let packets = null;
    if(model.timeSelector.currentValueRight && model.timeSelector.currentValueLeft){
        packets = model.full.packages.filter(x => x.timestamp >= model.timeSelector.currentValueLeft && x.timestamp <= model.timeSelector.currentValueRight);
    } else {
        packets = model.full.packages;
    }
    
    model.trafficOverview.cells = aggregatePackages(packets, dimensions.trafficOverview.cellDuration);

    renderTrafficOverview();
}

function updatePackageHistogram() {
	let packets = model.full.packages;

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
	
	console.log(cells);
    model.packageHistogram.cells = cells;
	
	renderPackageHistogram();
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
    eles.x.domain(d3.extent(model.packageHistogram.cells, d => d.size));
    eles.y.domain([0, d3.max(model.packageHistogram.cells, d => d.count)]);

    eles.g_xaxis.call(eles.xaxis);
    eles.g_yaxis.call(eles.yaxis);

    const line = d3.line()
        .x(d => eles.x(d.date))
        .y(d => eles.y(d.value));

    // TODO: enter/merge/exit?
    eles.g.append("path")
        .datum(model.packageHistogram.cells)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);
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