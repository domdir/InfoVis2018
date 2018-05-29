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
        height: null
    },
    timeSelector: {
        height: 20,
        handleRadius: 9
    }
};

const elements = {
    trafficOverview: {

    },
    timeSelector: {

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
    initTimeSelector();
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
            .on("start.interrupt", function () { eles.slider.interrupt(); })
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
            .on("start.interrupt", function () { eles.slider.interrupt(); })
            .on("start drag", function () {
                const val = Math.max(Math.min(eles.x.invert(d3.event.x).getTime(), interval_max), model.timeSelector.currentValueLeft);
                model.timeSelector.currentValueRight = val;
                eles.handleRight.attr("cx", eles.x(val));
            })
    );

    eles.handleLeft.attr("cx", eles.x(interval_min));
    eles.handleRight.attr("cx", eles.x(interval_max));
}

/// ###########################################
/// ############ UPDATE FUNCTIONS #############
/// ###########################################

function updateDimensions() {
    dimensions.trafficOverview.width = 960 - dimensions.trafficOverview.margin.left - dimensions.trafficOverview.margin.right;
    dimensions.trafficOverview.height = 500 - dimensions.trafficOverview.margin.top - dimensions.trafficOverview.margin.bottom;
}

function updateTrafficOverview() {
    let packets = model.full.packages;

    let interval_min = Math.min.apply(Math, packets.map(x => x.timestamp));
    let interval_max = Math.max.apply(Math, packets.map(x => x.timestamp));
    let duration = interval_max - interval_min;

    console.log("interval: " + interval_min + " - " + interval_max + " [dur=" + duration + "]");

    // aggregate troughput
    let cell_count = Math.ceil(duration);

    if (Math.ceil(interval_min) == Math.ceil(interval_max)) {
        cell_count = 1;
    }

    console.log("cell count: " + cell_count);

    let cells = new Array(cell_count);
    for (let i = 0; i < cells.length; i++) {
        let begin = Math.floor(interval_min);
        cells[i] = {
            begin: begin + i,
            end: begin + i + 1,
            center: begin + i + 0.5,
            date: new Date((begin + i + 0.5) * 1000),
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
    model.trafficOverview.cells = cells;

    renderTrafficOverview();
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
    eles.g.append("path")
        .datum(model.trafficOverview.cells)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);
}
