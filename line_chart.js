// https://raw.githubusercontent.com/low-ethan/webtest/main/netpwr2.csv

//Dynamic line chart code

// set the dimensions and margins of the graph
var margin_mini = {top: 50, right: 50, bottom: 50, left: 150},
    width_mini = 500 - margin_mini.left,
    height_mini = 200 - margin_mini.top - margin_mini.bottom;

var margin_main = {top: 50, right: 200, bottom: 50, left: 3},
    width_main = 900 - margin_main.left,
    height_main = 400 - margin_main.top - margin_main.bottom;

// Create bisector to be used for tool tip mouse over
var bisectDate = d3.bisector(function(d) { return d.GMT; }).left;

// Create formatting rules for tool tip
var formatValue = d3.format(".2f");
var dateFormatter = d3.timeFormat("%m/%d/%y %-I:%M%p");

// append the svg object to the body of the page

const add_arr = (array1, array2) => {
    for (let i = 0; i < array1.length; i++){
        array1[i] += array2[i].Net_pwr
    }
    return array1
}


const average = (array) => array.reduce((a, b) => a + b) / array.length;
//Read the data
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
    //m todo: if the arrays are differnt size, issues. 
    let arr_len = data.filter(function (d) {return d.Boat == allGroup[0]}).length
    let sum_arr = new Array(arr_len).fill(0);
    for (group of allGroup){
        let arr = data.filter(function (d) {
            return d.Boat == group
        })
        sum_arr = add_arr(sum_arr, arr)
    }
    console.log(sum_arr)
    let sum_cpy = sum_arr.slice(0)
    var dataFilter = data.filter(function (d) {
        return d.Boat == allGroup[0]
    })
    
    sum_cpy.forEach(function (value, index) {
        sum_cpy[index] = {"GMT":dataFilter[index].GMT, "Net_pwr":sum_cpy[index]}
    })
    
    console.log(sum_cpy)


    //make top line
    var svg = d3.select("#line_chart_dynamic")
        .append("svg")
        .attr("id", "#line_sums")
        .attr("viewBox", '0 0 1000 400') // to make svg responsive
        .style("padding-bottom", "40")
        .style("padding-top", "30")
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
        .domain([d3.min(sum_arr), d3.max(sum_arr)])
        .range([height_main, 0]);
    
    // add title
    svg.append('g')
        .append('text')
        .attr('class', 'title')
        .style("font-size", "45px")
        .attr('y', -30)
        .attr('x', 350)
        .html('num kw/s'.replace("num", Math.round(sum_arr.at(-1))));


    // maybe copy sum array b4?
    // Initialize line
    var line = svg
        .append('g')
        .append("path")
        .datum(data.filter(function (d) {
            return d.Boat == allGroup[0]
        }))
        .attr("d", d3.line()
            .x(function (d) {
                return x(d.GMT)
            })
            .y(function (d) {
                return y(sum_arr.shift())
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
            i = bisectDate(sum_cpy, x0, 1),
            d0 = sum_cpy[i - 1],
            d1 = sum_cpy[i],
            d = x0 - d0.GMT > d1.GMT - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.GMT) + "," + y(d.Net_pwr) + ")");
        focus.select(".tooltip-date").text(dateFormatter(d.GMT));
        focus.select(".tooltip-likes").text(formatValue(d.Net_pwr));
    }

    //#endregion


    for(let i = 0; i < allGroup.length; i++) {
        svg = d3.select("#line_chart_dynamic")
            .append("a")
            .attr("href", "boat_summary.html?id="+i)
            .append("svg")
            .attr("id", "#line_mini_"+i)
            .attr("viewBox", '-150 0 1000 200') // to make svg responsive
            .style("padding-bottom", "10")
            .style("padding-top", "10")
            .style("border-bottom", "1px dashed #4a7491")
            .append("g")
            .attr("transform",
                "translate(" + margin_mini.left + "," + margin_mini.top*1.5 + ")");


        // Add X axis --> it is a date format
        var x_mini = d3.scaleTime()
            .domain(d3.extent(data, function (d) {
                return d.GMT;
            }))
            .range([0, width_mini]);
        svg.append("g")
            .attr("transform", "translate(0," + height_mini + ")")
            .call(d3.axisBottom(x_mini));

        dataFilter = data.filter(function (d) {
            return d.Boat == allGroup[i]
        })
        var y_mini = d3.scaleLinear()
            .domain([d3.min(dataFilter, function (d) {
                return d.Net_pwr;
            }), d3.max(dataFilter, function (d) {
                return d.Net_pwr;
            })])
            .range([height_mini, 0]);
        
        // add title
        svg.append('g')
            .append('text')
            .attr('class', 'title')
            .style("font-size", "35px")
            .attr('y', 75)
            .attr('x', 395)
            .html('num kw/s'.replace("num", Math.round((data.filter(function (d) {
                return d.Boat == allGroup[i]
            }).at(-1).Net_pwr))));

        svg.append('g')
            .append('text')
            .attr('class', 'title')
            .style("font-size", "40px")
            .attr('y', 75)
            .attr('x', -295)
            .html(allGroup[i]);

        // Initialize line with first group of the list
         line = svg
            .append('g')
            .append("path")
            .datum(data.filter(function (d) {
                return d.Boat == allGroup[i]
            }))
            .attr("d", d3.line()
                .x(function (d) {
                    return x_mini(d.GMT)
                })
                .y(function (d) {
                    return y_mini(d.Net_pwr)
                })
            )
            .attr("stroke", '#4a7491')
            .style("stroke-width", 2)
            .style("fill", "none")
        
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
        // svg.append("g")
        //     .attr("class", "y_axis")
        //     .transition()
        //     .duration(1000)
        //     .call(d3.axisLeft(y)
        //         .tickFormat(d3.format(".2f")));

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

