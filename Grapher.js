

var data = {

    initVar: function () {
        //sets variables
        data.delimiter = ','
        data.numCol = 0
    },
    selectParser: function (parser, stringData) {
        //returns the delimiter for the parser in buildDataArray

        if (parser == 'auto') {
            return data.testParser(stringData)
        }
        else if (parser == 'CSV') {
            return ','
        }
        else if (parser == 'TSV') {
            return '\t'
        }
    },
    testParser: function (string) {

        //determines what delimiter the parser should use
        var countTab = (string.match(/\t/g) || []).length
        var countComma = (string.match(/,/g) || []).length

        if (countTab / (countTab + countComma) > .75) {
            return '\t'
        }
        else if (countComma / (countTab + countComma) > .75) {
            return ','
        }
        else {
            alert('The parser cannot automatically determine the format. It will default to CSV. Please specify Excel/TSV if that is the desired format.')
        }
    },
    buildArray: function (lines, delimiter) {

        //returns an array of an array
        //rebuild this for colspan
        var arrayOut = []
        $.each(lines, function (itemNo, item) {

            var dataRow = item.split(delimiter)

            data.numCol = Math.max(data.numCol, dataRow.length)

            //removes empty rows
            if ((dataRow.length > 1) || !(dataRow[0].length == 0)) {
                arrayOut.push(dataRow)
            }
        })
        return arrayOut
    },
    get: function () {
        //grabs raw data from the #text-in
        stringData = $('.data-in').val() //gets data as a string

        //parser = $('[name="parser"]').val() //gets parser option
        var parser = 'auto'

        data.delimiter = data.selectParser(parser, stringData)
        data.headerArray = stringData.split('\n')[0].split(data.delimiter)

        data.mainArray = data.buildArray(stringData.split('\n').slice(1), data.delimiter)
        data.numRow = data.mainArray.length
    },
    getAxis: function (axisIndex) {
        data[g.axisObj[axisIndex]] = data.mainArray.map(function(d,i) { return isNaN(d[axisIndex]) ?  d[axisIndex] : parseFloat(d[axisIndex])})
    },
    buildGraphData: function() {
        data.graphArray = data.x.map(function(d,i) {
            return {'x': d, 'y': data.y[i]}
        })
    },
    flipAxis: function (axis1, axis2) {
        var tempAxis = data[g.axisObj[axis1]].slice(0)

        data[g.axisObj[axis1]] = data[g.axisObj[axis2]] 
        data[g.axisObj[axis2]] = tempAxis
    },
    init: function() {
        data.initVar()
        data.get()
        data.getAxis(0)
        data.getAxis(1)
        //data.flipAxis(0,1)
        data.buildGraphData()
    }
}

var g = {
    chart: null,
    dim: {
    },
    dimFixed: {
        width: 500,
        height: 500,
        margin: {
            top: 80,
            right: 50,
            bottom: 50,
            left: 50
        }
    },
    axisObj: {
        0: 'x', 
        1: 'y'
    },
    title: {
        main: 'Please Enter a Graph Title',
        sub: 'subtitle',
        x: 'X-axis',
        y: 'Y-axis'
    },
    axis: {
        x: null,
        y: null
    },
    axisLim: {
        x: [0,100],
        y: [0,100]
    },
    scale: {
        x: null,
        y: null
    },
    clearChart: function()  {
        d3.selectAll('svg').remove()
        g.chart = d3.select('#d3-container')
            .append('svg')
            .attr('class', 'chart')
            .attr('fill', '#909090')
            .attr('width', g.dim.width + g.dim.margin.left + g.dim.margin.right)
            .attr('height', g.dim.height + g.dim.margin.top + g.dim.margin.bottom)
    },
    reset: function() {
        g.dim = $.extend(true, {}, g.dimFixed)
    },
    buildAxis: function () {

        var buildAxis = function(axis) {
            var axisType;
            var axisOrient;
            var axisOrientDir = axis == 'x' ?  'bottom' : 'left'

            var buildLinear = function() {
                g.axisLim[axis] = d3.extent(data[axis])

                var diff = g.axisLim[axis][1] - g.axisLim[axis][0]
                g.axisLim[axis][1] = g.axisLim[axis][1] + diff * .1
                g.axisLim[axis][0] = g.axisLim[axis][0] - diff * .1

                console.log(g.axisLim[axis])
                true ? g.axisLim[axis][0] = 0 : null //make this an option one day

                var dim = axis == 'x' ?  [0, g.dim.width] :  [g.dim.height, 0]



                g.scale[axis] = d3.scale.linear()
                            .domain(g.axisLim[axis])
                            .range(dim)

                g.axis[axis] = d3.svg.axis().scale(g.scale[axis])
                        .innerTickSize(4)
                        .outerTickSize(0)
                        .tickPadding(9)
                        .orient(axisOrientDir)
                        .tickFormat(d3.format('0.0f'))
            }

            var buildCategorical = function() {
                var dim = axis == 'x' ?  g.dim.width :  g.dim.height
                g.scale[axis] = d3.scale.ordinal()
                                .domain(data[axis])
                                .rangeBands([0, dim]) //gotta get the height and width

                g.axis[axis] = null
            }

            var setMargin = function() {

                var totalHeight = g.dim.margin.bottom + g.dim.margin.top + g.dim.height
                var totalWidth = g.dim.margin.left + g.dim.margin.right + g.dim.width

                g.clearChart()
                if (axisType == 'string') {
                    var tick = d3.select('svg').selectAll('text')
                        .data(data.graphArray)
                        .enter()
                        .append('text')
                            .style('fill', 'black')
                            .style("text-anchor", "end")
                            .text(function(d) {return d[axis]})
                }
                else {
                    d3.select('svg').append('g')
                        .attr('class', 'axis test')
                        .call(g.axis[axis])
                }

                if (axis == 'y') {
                    d3.selectAll('text').each(function(d) {
                        g.dim.margin.left = Math.max(g.dim.margin.left, this.getComputedTextLength() + 20) //account for somethings
                    })
                    g.dim.width = totalWidth - g.dim.margin.left - g.dim.margin.right
                }
                else {
                    d3.selectAll('text').each(function(d) {
                        g.dim.margin.bottom = Math.max(g.dim.margin.bottom, this.getComputedTextLength() + 10) //account for somethings
                    })
                    g.dim.height = totalHeight - g.dim.margin.bottom - g.dim.margin.top
                }
            }

            data[axis].forEach(function(d) {
                axisType = axisType == 'string' || isNaN(d) ? 'string' : 'numeric'
            })

            axisType == 'string' ? buildCategorical() : buildLinear()
            setMargin()
        }


        buildAxis('x')
        buildAxis('y')
        g.clearChart()

    },
    buildFrame: function() {
        var axisKeys = Object.keys(g.axis)

        axisKeys.forEach(function(d) {
            if (g.axis[d]) {
                //calls a linear axis
                var translate = d == 'y' ? 'translate(' + (g.dim.margin.left + .5) + ',' + g.dim.margin.top + ')' : 'translate(' + (g.dim.margin.left + .5) + ',' + (g.dim.margin.top + g.dim.height) + ')' 
                g.chart
                    .append('g')
                    .attr('transform', translate)
                    .attr('class', 'axis ' + d)
                    .call(g.axis[d])
            }
            else {
                //builds a categorical axis

                var translate = d == 'y' ? 'translate(' + (g.dim.margin.left + .5) + ',' + g.dim.margin.top + ')' : 'translate(' + g.dim.margin.left + ',' + (g.dim.margin.top + g.dim.height) + ')'
                var a = d == 'y' ? 'y' : 'x'
                var b = d == 'y' ? 'x' : 'y'

                var buildXCat = function() {

                    g.chart.append('g').attr('transform', translate).attr('class', 'axis x')
            
                    d3.select('.axis.x').append('line')
                        .attr('x1', 0)
                        .attr('x2', g.dim.width)
                        .attr('y1', 0)
                        .attr('y2', 0)
                        .style('stroke', 'black')

                    var tick = d3.select('.axis.x').selectAll('text')
                        .data(data.graphArray)
                        .enter()


                    tick.append('text')
                        .attr(b, function(d) { return g.scale.x(d.x) + 18 + g.dim.width / data.x.length / 2 - 15})
                        .attr(a, function(d) { return -10})
                        .style('fill', 'black')
                        .style("text-anchor", "end")
                        .attr('transform', 'rotate(-90)')
                        .text(function(d) {return d.x})

                    tick.append('rect')
                        .attr(a, function(d) { return g.scale.x(d.x) })
                        .style('fill', 'black')
                        .attr('height', 10)
                        .attr('width', 1)

                    d3.select('.axis.x').append('rect')
                        .attr(b, g.dim.width - 1)
                        .style('fill', 'black')
                        .attr('height', 10)
                        .attr('width', 1)
                }

                var buildYCat = function() {

                    g.chart.append('g').attr('transform', translate).attr('class', 'axis y')
            
                    d3.select('.axis.y').append('line')
                        .attr('y1', 0)
                        .attr('y2', g.dim.height)
                        .attr('x1', 0)
                        .attr('x2', 0)
                        .style('stroke', 'black')

                    var tick = d3.select('.axis.y').selectAll('text')
                        .data(data.graphArray)
                        .enter()


                    tick.append('text')
                        .attr('y', function(d) { return g.scale.y(d.y) + 18 + g.dim.height / data.y.length / 2 - 15})
                        .attr('x', function(d) { return -10})
                        .style('fill', 'black')
                        .style("text-anchor", "end")
                        .text(function(d) {return d.y})

                    tick.append('rect')
                        .attr(a, function(d) { return g.scale.y(d.y) })
                        .style('fill', 'black')
                        .attr('width', 10)
                        .attr('height', 1)

                    d3.select('.axis.x').append('rect')
                        .attr(b, g.dim.height- 1)
                        .style('fill', 'black')
                        .attr('width', 10)
                        .attr('height', 1)
                }

                d == 'y' ? buildYCat() : buildXCat()
            }
        })

        g.chart.append('text')
            .attr('x', 20)
            .attr('y', 30)
            .attr('class', 'title main')
            .text(g.title.main)
        
        g.chart.append('text')
            .attr('x', 21)
            .attr('y', 55)
            .attr('class', 'title sub')
            .text(g.title.sub)

    },
    buildChart() {
        console.log(g.dim)
        g.reset()
        g.buildAxis()
        g.buildFrame()


        var bars = g.chart.selectAll('.bar')
            .data(data.graphArray)
            .enter()


        if (g.axis.y) {
            bars.append('rect')
                .attr('y', function(d) { return g.dim.margin.top + g.scale.y(d.y) })
                .attr('x', function(d) {return g.scale.x(d.x) + g.dim.margin.left + g.dim.width / data.x.length / 2 - 15})
                .attr('height', function(d) { return g.dim.height-g.scale.y(d.y) })
                .attr('width', function(d) { return 30 }) //programmatically define this
                .style('fill', 'blue')
        }
        else {
            bars.append('rect')
                .attr('x', function(d) { return g.dim.margin.left })
                .attr('y', function(d) {return g.scale.y(d.y) + g.dim.margin.top + g.dim.height / data.y.length / 2 - 15})
                .attr('width', function(d) { return g.scale.x(d.x) })
                .attr('height', function(d) { return 30 }) //programmatically define this
                .style('fill', 'blue')
        }


    },
    
}

$('#go').click(function() { data.init(); g.buildChart()})