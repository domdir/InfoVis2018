const margin = {top: 20, right: 20, bottom: 30, left: 50};
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// create traffic graph
const svg = d3
	.select("#traffic_overview")
	.append("svg")
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.style("border", "1px solid black");

const g = svg.append("g")
	.attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleTime()
	.rangeRound([0, width]);
const y = d3.scaleLinear()
	.rangeRound([height, 0]);

const xaxis = d3.axisBottom().scale(x);
const g_xaxis = g.append("g")
	.attr("class", "x axis")
	.attr("transform", `translate(0, ${height})`);
const yaxis = d3.axisLeft().scale(y);
const g_yaxis = g.append('g').attr('class','y axis');


// load data
d3.json("./assets/dump-small.json").then(function(data) {
	console.log(data);

	let packets = data.packages;

	let interval_min = Math.min.apply(Math, packets.map(x => x.timestamp));
	let interval_max = Math.max.apply(Math, packets.map(x => x.timestamp));
	let duration = interval_max - interval_min;

	console.log("interval: " + interval_min + " - " + interval_max + " [dur=" + duration + "]");

	// aggregate troughput
	let cell_count = Math.ceil(duration);

	if(Math.ceil(interval_min) == Math.ceil(interval_max)) {
		cell_count = 1;
	}


	console.log("cell count: " + cell_count);

	let cells = new Array(cell_count);
	for(let i = 0; i < cells.length; i++) {
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
	for(let i = 0; i < cell_count; i++) {
		cells[i].value = 0;
		for(let j = last; j < packets.length; j++) {
			let packet = packets[j];
			if(packet.timestamp >= cells[i].end) {
				break;
			} else {
				last = j;
				cells[i].value += packet.pkg_size;
			}
		}
	}

	cells[0].begin = interval_min;
	cells[cell_count - 1].end = interval_max;

	for(let i = 0; i < cells.length; i++) {
		cells[i].value /= (cells[i].end - cells[i].begin); // normalize to bytes/sec
	}

	console.log(cells);

	// draw graph
	x.domain(d3.extent(cells, d => d.date));
	y.domain([0, d3.max(cells, d => d.value)]);

	g_xaxis.call(xaxis);
	g_yaxis.call(yaxis);

	const line = d3.line()
		.x(d => x(d.date))
		.y(d => y(d.value));

	// TODO: enter/merge/exit?
	g.append("path")
		.datum(cells)
		.attr("fill", "none")
		.attr("stroke", "black")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", line);
});
