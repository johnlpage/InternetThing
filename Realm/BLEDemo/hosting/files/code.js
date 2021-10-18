let realmapp = null;
let vueapp = null;


//TODO - Move these to vueApp




const ranges = { a: 2, g: 750, m: 500,i:180,h:360, v: 1 } //Scaling
const icons = { }

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
            charts: ['ax', 'ay', 'az', 'gx', 'gy', 'gz'/*,'in','hd'/*, 'mx', 'my', 'mz'*/],
            labels: { ax: "Forwards Acceleration", ay: "Sideways Acceleration", az: "Vertical Acceleration", gx: "Roll Speed", gy: "Pitch Speed", gz: "Yaw Speed"},

            aggregation: "",
            errormsg: "",
            username: "Amazon",
            chartdata: {},
            functionversion: 1,
            lastSeen: new Date(),
            timeoutHandle: 0,
            wfuncs: [],
            testAgg: {},
            derivedmessage: "",
            devices: ["MongoThing_001","MongoThing_002"],
            device: "MongoThing_001"
        },
        methods: {
            updateAggreagtion: runClicked,
            stopAggregation,
            devChanged: devChanged
        }
    })
    return v;
}


function initd3chart(id) {

    var n = 500
    let data = d3.range(n).map(() => 0);


    let svg = d3.select(`#${id}`),
        margin = { top: 10, right: 10, bottom: 10, left: 10 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom

    //svg.selectall("g").remove();

    /* svg.append("rect")
         .attr("class", "linechartbg")
         .attr("width", "100%")
         .attr("height", "100%")*/

    let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    isHorizontal = width > height;
    //isHorizontal=true

    let x, y, line, v;

    rangescale = ranges[id.substring(0, 1)]

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

    /*
        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + y(0) + ")")
            .call(d3.axisBottom(x));
    
        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y));*/

    let ldata = { svg, data, x, y, width, height, line, databuf: [0], isHorizontal, largest: 0 }
    vueapp.chartdata[id] = ldata;

    g.append("g")
        .attr("clip-path", `url(#clip_${id})`)
        .append("path")
        .datum(data)
        .attr("class", "line")
        .attr("id", `p_${id}`)
        .transition()
        .duration(40)
        .ease(d3.easeLinear)
        .on("start", tickv);
}


function tickv() {

    gname = this.id.substring(2)
    cdata = vueapp.chartdata[gname]

    //We have no more data at all to add an empty record
    //We will figure out what to do with that in the next lin
    if (cdata.databuf.length == 0) {  //Add a 0 to scroll it off
        empty = { ts: new Date() }
        cdata.databuf.push(empty)
    };
    newcount = 0;

    datapoint = cdata.databuf.shift()[gname]
    if (datapoint == undefined || datapoint == null) {

        //Either we had no data or we dont have a value for this metric
        //This is possible as we don't get magentometer readings every time
        //we could just duplicate the last data point we had
        datapoint = cdata.data[cdata.data.length - 1]

    }

    //If we have too many datapoints not shown push them through faster
    // Push a new data point onto the back.
    cdata.data.push(datapoint);
    newcount++;

    //If we built up a backlog in the data buffer (25 - 0.5 seconds) clear it down to 2
    //If we clear just enough we never get past the issue and it stays jerky

    if (cdata.databuf.length > 25) {
        console.log(`Catchup ${cdata.databuf.length}`)
        while (cdata.databuf.length > 2) {
            datapoint = cdata.databuf.shift()[gname]
            if (datapoint == undefined || datapoint == null) {

                datapoint = cdata.data[cdata.data.length - 1]
                if (datapoint == undefined || datapoint == null) datapoint = cdata.data[cdata.data.length - 1];
            }
            cdata.data.push(datapoint);
            newcount++;
        }
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
    while (newcount-- > 0) { cdata.data.shift(); }

}


async function onLoad() {
    vueapp = initVue()
    await initRealm()

    //Fetch our sameple aggreagtions
    try {
        wfuncs = await realmapp.currentUser.mongoClient("mongodb-atlas").db("blescan").collection("windowfunctions").find({})
        try {
            wfuncs.forEach((f) => {
                f.function = JSON.stringify(eval(`(${f.function})`), null, 2)
                vueapp.wfuncs.push(f)
            })
        } catch (c) {
            console.log(c)
        }
    } catch (e) {
        vueapp.errormsg = e;
    }

    //Setup up all our charts
    vueapp.charts.forEach((name) => { initd3chart(name) });
    initd3chart("value")
    updateData(); //Async Realm data pull

    //Was looking at 3d model but thats slow in JS
    //init3d();
    //animate3d();

}

function devChanged()
{
    //Clear the ghraph here - not sure how
   
}

function updateData() {

    user = realmapp.currentUser;
    user.functions.getData(vueapp.lastSeen,vueapp.device).then((result) => {

        if (result.data.length > 0) { vueapp.lastSeen = result.data[0].ts } //Buffer comes back newest first

        result.data.reverse() // As it was newest first
        vueapp.charts.forEach((cname) => {
            vueapp.chartdata[cname].databuf = vueapp.chartdata[cname].databuf.concat(result.data)
        }
        ); //We couuld filter some fields out here as we have all data for each chart
        setTimeout(updateData, 1);
    });
}

//Run an aggregation which fetches all data for the last n datapoints as seen on the graph
function runClicked() {
    vueapp.errormsg = "";

    try {
        console.log(vueapp.aggregation)
        qstr = vueapp.aggregation.replace("\n", " ")
        vueapp.testAgg = eval(`(${qstr})`) //Evil eval means no quotes needed
    } catch (e) {
        //alert(e) 
        vueapp.errormsg = e
        return; //Can't run and so stop
    }

    vueapp.chartdata['value'].largest = 0.5;

    vueapp.chartdata['value'].y = d3.scaleLinear()
        .domain([-vueapp.chartdata['value'].largest, vueapp.chartdata['value'].largest])
        .range([vueapp.chartdata['value'].height, 0]);

    vueapp.chartdata['value'].line = d3.line()
        .curve(d3.curveBasis)
        .x(function (d, i) { return vueapp.chartdata['value'].x(i); })
        .y(function (d, i) { return vueapp.chartdata['value'].y(d); });

    if (vueapp.timeoutHandle) {
        console.log(`Stopping timeout ${vueapp.timeoutHandle}`)
        clearTimeout(vueapp.timeoutHandle) //Stop any running timer

    }
    //Dont start until we are sure it's stopped
    vueapp.functionversion++;
    console.log(`updatagg(${vueapp.functionversion})`)
    highlightGraphs()
    updateAggregation(vueapp.functionversion)
}

/* Highlight any graphs mentioned in our query */

function highlightGraphs() {
    //Very simple - Run a regex for $[amx][xyz]
    const re = /\$[amgih][ndxyz]/g
    varsused = vueapp.aggregation.match(re)
    vueapp.charts.forEach(c => {
        el = document.getElementById(c);
        id=`$${c}`;
        console.log(id)
        if (el && varsused && varsused.includes(id)) 
        { el.parentElement.style.opacity = 1  }
        else
         { el.parentElement.style.opacity = 0.1 }
    });
    console.log(varsused)
}

function showGraphs() {
    vueapp.charts.forEach(c => {
        el = document.getElementById(c);
        id=`$${c}`;
         el.parentElement.style.opacity = 1 
    });
}

function stopAggregation()
{
    vueapp.functionversion++;
    showGraphs();

}

function updateAggregation(version) {

    //Send our agg query to the server
    user = realmapp.currentUser;

    //We have to remember to clear this when we change the aggregation though

    Promise.all([version, user.functions.runWindowAgg(vueapp.lastSeen, vueapp.testAgg,vueapp.device,vueapp.username)]).then(([a, result]) => {
        if (vueapp.functionversion != a) { console.log(`cancelled ${vueapp.functionversion} != ${a}`); return; }

        //console.log(result)
        if (result.ok) {
            vueapp.chartdata['value'].databuf = vueapp.chartdata['value'].databuf.concat(result.data)
           
        } else {
            vueapp.errormsg = result.errormsg;
            console.log(result)
            return;
        }
        //vueapp.errormsg  = ""
        //Adjust the scale for the largest data item we have seen 
        result.data.forEach((r) => {

            if (Math.abs(r.value) > vueapp.chartdata['value'].largest) {
                //console.log(`Resizing to ${Math.abs(r.value)}`)
                vueapp.chartdata['value'].largest = Math.abs(r.value)

                vueapp.chartdata['value'].y = d3.scaleLinear()
                    .domain([-vueapp.chartdata['value'].largest, vueapp.chartdata['value'].largest])
                    .range([vueapp.chartdata['value'].height, 0]);

                vueapp.chartdata['value'].line = d3.line()
                    .curve(d3.curveBasis)
                    .x(function (d, i) { return vueapp.chartdata['value'].x(i); })
                    .y(function (d, i) { return vueapp.chartdata['value'].y(d); });

            }
          
            if(r.message) vueapp.errormsg  = r.message;
        });

        vueapp.timeoutHandle = setTimeout(updateAggregation, 1, a);
       
    }).catch(e => { vueapp.errormsg = e });
}