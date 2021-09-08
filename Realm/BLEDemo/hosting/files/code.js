let realmapp = null;
let vueapp = null;
let lastSeen = new Date();
let chartdata = {}
//let databuffer = []
const charts = ['az', 'ay', 'ax','gx','gy','gz','mx','my','mz']
const ranges = { a: 4, g: 1000, m: 400}

async function initRealm() {
    realmapp = new Realm.App({ id: "bledemo-pjitb" });
    const credentials = Realm.Credentials.anonymous();

    try {
        const user = await realmapp.logIn(credentials);
    } catch (err) {
        alert("Failed to log in", err);
    }
}

function initVue() {
    let v = new Vue({
        el: '#app',
        data: {
            message: 'Hello Vue!'
        }
    })
    return v;
}


function initd3chart(id) {

    var n = 500
    let data = d3.range(n).map(() => 0);

    let svg = d3.select(`#${id}`),
        margin = { top: 20, right: 20, bottom: 20, left: 40 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom

    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "lightgrey");

    let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    isHorizontal = width > height;
    //isHorizontal=true

    let x, y, line;

    rangescale = ranges[id.substring(0,1)]

    if (isHorizontal) {
        x = d3.scaleLinear()
            .domain([1, n - 2])
            .range([0, width]);

        y = d3.scaleLinear()
            .domain([-rangescale, rangescale])
            .range([height, 0]);

        line = d3.line()
            .curve(d3.curveBasis)
            .x(function (d, i) { return x(i); })
            .y(function (d, i) { return y(d); });

    } else {
        x = d3.scaleLinear()
            .domain([-rangescale, rangescale])
            .range([width, 0]);

        y = d3.scaleLinear()
            .domain([1, n - 2])
            .range([0, height]);


        line = d3.line()
            .curve(d3.curveBasis)
            .x(function (d, i) { return x(d); })
            .y(function (d, i) { return y(i); });
    }



    g.append("defs").append("clipPath")
        .attr("id", `clip_${id}`)
        .append("rect")
        .attr("width", width)
        .attr("height", height);


    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y));

    let ldata = { svg, data, x, y, line, databuf: [], isHorizontal }
    chartdata[id] = ldata;

    g.append("g")
        .attr("clip-path", `url(#clip_${id})`)
        .append("path")
        .datum(data)
        .attr("class", "line")
        .attr("id", `p_${id}`)
        .transition()
        .duration(15)
        .ease(d3.easeLinear)
        .on("start", tickv);
}


function tickv() {

    gname = this.id.substring(2)
    cdata = chartdata[gname]

    //We have no more data at all to add an empty record
    //We will figure out what to do with that in the next lin
    if (cdata.databuf.length == 0) {  //Add a 0 to scroll it off
        empty = { ts: new Date() }
        cdata.databuf.push(empty)
    };
    newcount =0;
    //If we built up a backlog in the data buffer clear it by sending up to 5 at a time
    while(cdata.databuf.length > 5) {0}
        datapoint = cdata.databuf.shift()[gname]
        if(datapoint == undefined) {
            //Either we had no data or we dont have a value for this metric
            //This is possible as we don't get magentometer readings every time
            //we could just duplicate the last data point we had
            datapoint = cdata.data[cdata.data.length]
            if (datapoint == undefined) datapoint=0;
        }

        //If we have too many datapoints not shown push them through faster


        // Push a new data point onto the back.

        cdata.data.push(datapoint);
        newcount++;
    }
    // Redraw the line.
    d3.select(this)
        .attr("d", cdata.line)
        .attr("transform", null);

    if (cdata.isHorizontal) {
        d3.active(this)
            .attr("transform", "translate(" + cdata.x(0) + ",0)")
            .transition()
            .on("start", tickv);
    } else {

        // Slide it down
        d3.active(this)
            .attr("transform", "translate(" + cdata.y(0) + ",0)")
            .transition()
            .on("start", tickv);

    }
    // Pop the old data point off the front. 
    while(newcount-- > 0) { cdata.data.shift(); }

}


async function onLoad() {
    vueapp = initVue()
    await initRealm()
    if (realmapp.currentUser) { vueapp.message = realmapp.currentUser.id }
    //Setup up all our charts
    charts.forEach((name) => { initd3chart(name) });

    updateData(); //Async Realm data pull
}

function updateData() {

    user = realmapp.currentUser;
    user.functions.getData(lastSeen).then((result) => {
        if (result.data.length > 0) { lastSeen = result.data[0].ts } //Buffer comes back newest first

        result.data.reverse() // As it was newest first
        charts.forEach((cname) => {
            chartdata[cname].databuf = chartdata[cname].databuf.concat(result.data)
        }
        ); //We couuld filter some fields out here as we have all data for each chart
        setTimeout(updateData, 1);
    });
}