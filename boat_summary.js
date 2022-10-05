// https://github.com/jonathangiguere/Robinhood_Investment_Web_App

var margin_main = {top: 50, right: 200, bottom: 50, left: 3},
    width_main = 900 - margin_main.left,
    height_main = 400 - margin_main.top - margin_main.bottom;

// Create bisector to be used for tool tip mouse over
var bisectDate = d3.bisector(function(d) { return d.GMT; }).left;

// Create formatting rules for tool tip
var formatValue = d3.format(".2f");
var dateFormatter = d3.timeFormat("%m/%d/%y %-I:%M%p");


//get id from url
let idFromUrl = 0
var urlParams = new URLSearchParams(location.search)
for (const [key, value] of urlParams) {
    if (key == "id"){
        idFromUrl = value
    }
}

d3.csv("https://raw.githubusercontent.com/low-ethan/webtest/main/netpwr2.csv", function(data) {


    // format the data
    data.forEach(function(d) {
        d.GMT = d3.timeParse("%-m/%-d/%Y %I:%M")(d.GMT);
        d.Net_pwr = +d.Net_pwr;
    });

    // List of groups by stock symbol
    var allGroup = d3.map(data, function(d){return(d.Boat)}).keys()
    console.log(allGroup)

    //#region top graph

    var dataFilter = data.filter(function (d) {
        return d.Boat == allGroup[idFromUrl]
    })
    

    //make top line
    var svg = d3.select("#line_chart_boat_summary")
        .append("svg")
        .attr("id", "#line_sums")
        .attr("viewBox", '0 0 1000 400') // to make svg responsive
        .style("padding-bottom", "30px")
        .style("padding-top", "60px")
        .append("g")
        .attr("transform",
            "translate(" + margin_main.left + "," + margin_main.top*1.5 + ")");
    var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) {
            return d.GMT;
        }))
        .range([0, width_main]);

    svg.append("g")
        .attr("transform", "translate(0," + height_main + ")")
        .call(d3.axisBottom(x));

    var y = d3.scaleLinear()
        .domain([d3.min(dataFilter, function (d) {
            return d.Net_pwr;
        }), d3.max(dataFilter, function (d) {
            return d.Net_pwr;
        })])
        .range([height_main, 0]);


    svg.append('g')
        .append('text')
        .attr('class', 'title')
        .style("font-size", "35px")
        .attr('y', -45)
        .attr('x', 350)
        .html(allGroup[idFromUrl]);
    
    // add title
    svg.append('g')
        .append('text')
        .attr('class', 'title')
        .style("font-size", "25px")
        .attr('y', -10)
        .attr('x', 350)
        .html('num kw/s'.replace("num", Math.round((data.filter(function (d) {
            return d.Boat == allGroup[idFromUrl]
        }).at(-1).Net_pwr))));


    // maybe copy sum array b4?
    // Initialize line
    var line = svg
        .append('g')
        .append("path")
        .datum(data.filter(function (d) {
            return d.Boat == allGroup[idFromUrl]
        }))
        .attr("d", d3.line()
            .x(function (d) {
                return x(d.GMT)
            })
            .y(function (d) {
                return y(d.Net_pwr)
            })
        )
        .attr("stroke", '#4a7491')
        .style("stroke-width", 2)
        .style("fill", "none")

    //#region focus

    // appending group element to SVG canvas
    var focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

    // Add a circle to focus group
    focus.append("circle")
        .attr("r", 3);

    // Add actual tool tip box to focus group
    focus.append("rect")
        .attr("class", "tooltip")
        .attr("width", 160)
        .attr("height", 50)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    // Text for date
    focus.append("text")
        .attr("class", "tooltip-date")
        .attr("x", 18)
        .attr("y", -2);

    // Text for close price
    focus.append("text")
        .attr("x", 18)
        .attr("y", 18)
        .text("Power (kw/s):");

    // value for close price
    focus.append("text")
        .attr("class", "tooltip-likes")
        .attr("x", 100)
        .attr("y", 18);

    // transparent rect for tool tip mouseover
    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width_main)
        .attr("height", height_main)
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    //#endregion

    // Tooltip function
    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(dataFilter, x0, 1),
            d0 = dataFilter[i - 1],
            d1 = dataFilter[i],
            d = x0 - d0.begins_at > d1.begins_at - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.GMT) + "," + y(d.Net_pwr) + ")");
        focus.select(".tooltip-date").text(dateFormatter(d.GMT));
        focus.select(".tooltip-likes").text(formatValue(d.Net_pwr));
    }

    //---------------------------------------------------------------------------------------------------------------------------------------

    // A function that update the chart
    function update(selectedGroup) {

        // Create new data with the selection
        var dataFilter = data.filter(function(d){return d.Boat==selectedGroup});

        // Add Y axis with selected group to get y axis right
        var y = d3.scaleLinear()
            .domain([d3.min(dataFilter, function(d) { return d.Net_pwr; }), d3.max(dataFilter, function(d) { return d.Net_pwr; })])
            .range([ height_mini, 0 ]);
        
        // Give these new data to update line
        line
            .datum(dataFilter)
            .transition()
            .duration(1000)
            .attr("d", d3.line()
                .x(function(d) { return x(d.GMT) })
                .y(function(d) { return y(d.Net_pwr) })
            )
            .attr("stroke", '#4a7491')

        // transparent rect for tool tip mouseover
        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width_mini)
            .attr("height", height_mini)
            .on("mouseover", function() { focus.style("display", null); })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", mousemove);

        // Tooltip function
        function mousemove() {
            var x0 = x.invert(d3.mouse(this)[0]),
                i = bisectDate(dataFilter, x0, 1),
                d0 = dataFilter[i - 1],
                d1 = dataFilter[i],
                d = x0 - d0.GMT > d1.GMT - x0 ? d1 : d0;
            focus.attr("transform", "translate(" + x(d.GMT) + "," + y(d.Net_pwr) + ")");
            focus.select(".tooltip-date").text(dateFormatter(d.GMT));
            focus.select(".tooltip-likes").text(formatValue(d.Net_pwr));
        }
    } //end of updateChart function

    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function(d) {
        // Select y axis by HTML class and remove when selection is changed
        var old_y_axis = d3.select('.y_axis');
        old_y_axis.remove();
        // Select overlay rect by HTML class and remove when selection is changed
        var old_rect = d3.select('.overlay');
        old_rect.remove();
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value")
        // run the updateChart function with this selected option
        update(selectedOption)
    })
});
