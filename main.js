// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 700;

let svg1 = d3.select("#graph1")
    .append("svg")
    .attr('width', graph_1_width)     // HINT: width
    .attr('height', graph_1_height)     // HINT: height
    .append("g")
    .attr('transform', `translate(${margin.left}, ${margin.top})`);    // HINT: transform

let years = ['2020', '2019', '2018', '2017', '2016'];

function addMoreYears() {
    d3.select("#graph1").selectAll("svg").remove();

    svg1 = d3.select("#graph1")
    .append("svg")
    .attr('width', graph_1_width)     // HINT: width
    .attr('height', graph_1_height)     // HINT: height
    .append("g")
    .attr('transform', `translate(${margin.left}, 40)`);    // HINT: transform

    let availableYears = [];
    for (let i = 1872; i <= 2015; i++) {
        availableYears.push(i);
    }
    const yearsInput = document.getElementById('input-years');
    if (yearsInput !== null && (!availableYears.includes(parseInt(yearsInput.value)) || years.includes(yearsInput.value))) {
        alert("invalid year input");
        return;
    }
    if (yearsInput !== null)
        years.push(yearsInput.value);
    setYears();
}

let button = document.getElementById('submit-year');
button.addEventListener("click", addMoreYears);

function setYears() {
    d3.csv('./data/football.csv').then(function(data) {
        years.sort((a, b) => { return a - b });

        const games = gameInYears(data, years);
        let gamesByYear = d3.nest()
            .key((d) => {
                return d.date.split('-')[0];
            })
            .sortKeys(d3.ascending)
            .rollup((v) => {
                return v.length;
            })
            .entries(games);

        let x = d3.scaleLinear()
            .domain([years[0], years[years.length-1]])
            .range([0, graph_1_width - margin.left - margin.right]);
        
        svg1.append("g")
            .attr("transform", `translate(0, ${graph_1_height - margin.top - margin.bottom})`)       // HINT: Position this at the bottom of the graph. Make the x shift 0 and the y shift the height (adjusting for the margin)
            .call(d3.axisBottom(x).tickValues(gamesByYear.map((x) => x.key)).tickPadding(10));

        let y = d3.scaleLinear()
            .domain([d3.max(gamesByYear, function(d) { return d.value; }), 0])
            .range([0, graph_1_height - margin.top - margin.bottom]);

        svg1.append("g")
            .call(d3.axisLeft(y));

        let color = d3.scaleOrdinal()
            .domain(gamesByYear.map((x) => { return x.key }))
            .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#ff5c7a"), gamesByYear.length));
        
        let dots = svg1.selectAll("dot").data(gamesByYear);
        
        dots.enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.key); }) 
            .attr("cy", function (d) { return y(d.value); })
            .attr("r", 4)       // HINT: Define your own radius here
            .style("fill",  function(d){ return color(d.key); })

        let linearRegression = d3.regressionLinear()
            .x(d => d.key)
            .y(d => d.value)
        // console.log(gamesByYear)
        let res = linearRegression(gamesByYear);

        let line = d3.line()
            .x((d) => { return x(d[0]) })
            .y((d) => { return y(d[1]) })

        svg1
            .append('path')
            .datum(res)
            .attr('d', line)
            .style("stroke", "steelblue")
            .style("stroke-width", "2px");

        const x_middle = graph_1_width / 2;
        const y_middle = graph_1_height / 2;
        svg1.append("text")
            .attr("transform", `translate(${x_middle / 2}, ${y_middle+80})`)     // HINT: Place this at the bottom middle edge of the graph - use translate(x, y) that we discussed earlier
            .style("text-anchor", "middle")
            .text("Year");

        svg1.append("text")
            .attr("transform", `translate(-100, ${y_middle})`)       // HINT: Place this at the center left edge of the graph - use translate(x, y) that we discussed earlier
            .style("text-anchor", "middle")
            .text("Number of games");

        svg1.append("text")
            .attr("transform", `translate(${x_middle-100}, -10)`)       // HINT: Place this at the top middle edge of the graph - use translate(x, y) that we discussed earlier
            .style("text-anchor", "middle")
            .style("font-size", 15)
            .text("Games over year");

        dots.exit().remove();
        // counts.exit().remove();
    });
}

setYears();

//----------------------graph2------------------------------

var projection = d3.geoMercator()
    .center([20, -50])           
    .scale(100) 

let svg2 = d3.select("#graph2").append("svg")
    .attr("width", MAX_WIDTH)
    .attr("height", graph_2_height);

var path = d3.geoPath()
    .projection(projection);

var g = svg2.append("g");

var tooltip = d3.select("#graph2").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

d3.csv('./data/football.csv').then(function (data) {
    
    const gamesByCountry = totalGamesOfCountry(data);
    const winsByCountry = victoryGamesOfCountry(data);

    const top10Country = winsByCountry.sort((a, b) => { return b.value - a.value }).slice(0, 10);
    // console.log(top10Country);
    var countries = [];

    let top10sWinPercentage = getWinPercentage(top10Country, gamesByCountry);

    top10Country.forEach((country) => {
        countries.push(country.name);
    });

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function(data){
        data.features = data.features.filter(function(d){ return countries.includes(d.properties.name)})
        top10sWinPercentage = top10sWinPercentage.sort((a, b) => { return a.name.localeCompare(b.name) })
        // sorting alone won't do the trick: KOR comes before MEX but Mexico comes before South Korea
        // also true for GBR & DEU
        const kor = top10sWinPercentage[8];
        top10sWinPercentage[8] = top10sWinPercentage[7];
        top10sWinPercentage[7] = kor;
        const gbr = top10sWinPercentage[2];
        top10sWinPercentage[2] = top10sWinPercentage[4];
        top10sWinPercentage[4] = gbr;

        g.selectAll("path")
            .data(data.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("fill", 'blue')
            .attr("d", d3.geoPath()
                .projection(projection));
        
        g.selectAll(".country")
            .data(top10sWinPercentage)
            .on("mouseover", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html('The winning rate for ' +
                    d.name +
                    "<br/>" +
                    "is: " +
                    (d.value * 100).toFixed(2) + '%')
                .style('hidden', false)
                .style("left", (d3.event.pageX) + "px")             
                .style("top", (d3.event.pageY) + "px");
                d3.select(this)
                    .attr("fill", "grey")
                    .attr("stroke-width", 2);
            })
            .on("mouseout", function(d) {
                d3.select(this)
                    .attr("fill", "blue")
            });
    });
});

// --------------------graph3-----------------------------

let svg3 = d3.select("#graph3").append("svg")
    .attr("width", MAX_WIDTH)
    .attr("height", graph_3_height);


var tooltip1 = d3.select("#graph3").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.json("./data/graph3.json").then(function(data) {
    let allnode = data.nodes.map((d) => { return d.name });

    let x = d3.scalePoint()
    .range([10, MAX_WIDTH-220])
    .domain(allnode)

    let color = d3.scaleOrdinal(data.nodes.map(d => d.name).sort(d3.ascending), d3.schemeCategory10);

    const nodes = svg3
        .selectAll("myNodes")
        .data(data.nodes)
        .enter()
        .append("circle")
            .attr("class", "cNodes")
            .attr("cx", (d) => { return x(d.name) })
            .attr("cy", graph_3_height-150)
            .attr("r", 5)
            .style("fill", (d) => { return color(d.name) })
    
    svg3
        .selectAll("myLabels")
        .data(data.nodes)
        .enter()
        .append("text")
            .text((d) => { return d.name })
            .style("text-anchor", "start")
            .style("font-size", "10px")
            .attr('transform', function(d) {
                return `translate(${x(d.name)},${graph_3_height-125})rotate(90)`
            });

    let id2node = {}
    data.nodes.forEach((d) => {
        id2node[d.id] = d;
    });

    const links = svg3
        .selectAll("mylinks")
        .data(data.links)
        .enter()
        .append('path')
        .attr('d', (d) => {
            start = x(id2node[d.source].name)
            end = x(id2node[d.target].name)
            return ['M', start, graph_3_height-150,
                'A',
                (start - end)/2, ',',
                (start - end)/2, 0, 0, ',',
                start < end ? 1 : 0, end, ',', graph_3_height-150]
            .join(' ');
        })
        .style('fill', 'none')
        .attr('stroke', 'black')

    d3.csv('./data/football.csv').then(function (data) {
        let games = get2WorldCupGames(data);
        const totalGameNum = totalGamesOfCountry(games);
        const totalVictoryNum = victoryGamesOfCountry(games);
        const winPercentage = getWinPercentage(totalVictoryNum, totalGameNum);

        svg3.selectAll(".cNodes")
            .data(winPercentage)
            .on("mouseover", function(d) {
                d3.select(this)
                    .style('fill', "firebrick")
                links
                    .style('stroke', (arc) => {
                        return id2node[arc.source].name === d.name || id2node[arc.target] === d.name ? 'firebrick' : 'black';
                    })
                    .style('stroke-width', (arc) => {
                        return id2node[arc.source].name === d.name || id2node[arc.target] === d.name ? 4 : 1;
                    });
                tooltip1.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip1.html('The winning rate for ' +
                    d.name +
                    "<br/>" +
                    "is: " +
                    (d.value * 100).toFixed(2) + '%')
                .style('hidden', false)
                .style("left", (d3.event.pageX) + "px")             
                .style("top", (d3.event.pageY) + "px");
                d3.select(this)
                    .attr("fill", "grey")
                    .attr("stroke-width", 2);
            })
            .on("mouseout", function(d) {
                nodes.style('fill', (c) => {return color(c.name) });
                links.style('stroke', 'black');
                links.style('stroke-width', 1);
            });
    })

});



//----------------------utils------------------------------


function gameInYears(data, years) {
    return data.filter((d) => {
        let year = d.date.split('-')[0];
        return years.includes(year);
    })
}

function totalGame(gamesByHome, gamesByAway) {
    let total = {};
    
    gamesByHome.forEach((country) => {
        if (total.hasOwnProperty(country.key)) {
            total[country.key] = total[country.key] + country.value;
        }
        else {
            total[country.key] = country.value;
        }
    });
    gamesByAway.forEach((country) => {
        if (total.hasOwnProperty(country.key)) {
            total[country.key] = total[country.key] + country.value;
        }
        else {
            total[country.key] = country.value;
        }
    });
    let res = [];
    for (let key in total) {
        res.push({name: key, value: total[key]})
    }
    return res;
}

function getWinPercentage(countries, gamesInTotal) {
    let percentage = {};
    countries.forEach((country) => {
        percentage[country.name] = country.value;
    });
    gamesInTotal.forEach((country) => {
        if (percentage.hasOwnProperty(country.name)) {
            percentage[country.name] /= country.value;
        }
    });
    let res = [];
    for (let key in percentage) {
        res.push({name: key, value: percentage[key]})
    }
    return res;
}

function get2WorldCupGames(data) {
    const worldCupYears = ["2014", "2018"];
    const allGameIn = gameInYears(data, worldCupYears);
    return allGameIn.filter((d) => {
        return d.tournament === "FIFA World Cup";
    });
}

function totalGamesOfCountry(data) {
    let gamesByHome = d3.nest()
        .key((d) => {
            return d.home_team;
        })
        .sortKeys(d3.ascending)
        .rollup((v) => {
            return v.length;
        })
        .entries(data);

    let gamesByAway = d3.nest()
        .key((d) => {
            return d.away_team;
        })
        .sortKeys(d3.ascending)
        .rollup((v) => {
            return v.length;
        })
        .entries(data);

    return totalGame(gamesByHome, gamesByAway);
}

function victoryGamesOfCountry(data) {
    let homeWin = d3.nest()
        .key((d) => {
            return d.home_team;
        })
        .sortKeys(d3.ascending)
        .rollup((v) => {
            return v.filter((g) => {
                return g.home_score > g.away_score;
            }).length;
        })
        .entries(data);

    let awayWin = d3.nest()
        .key((d) => {
            return d.away_team;
        })
        .sortKeys(d3.ascending)
        .rollup((v) => {
            return v.filter((g) => {
                return g.away_score > g.home_score;
            }).length;
        })
        .entries(data);

    return totalGame(homeWin, awayWin);
}