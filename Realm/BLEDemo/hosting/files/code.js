let realmapp = null;
let vueapp = null;
let lastSeen = new Date();
let data,line,x
let databuffer=[]

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

function initd3() {
    var n = 500
    //random = d3.randomNormal(0, .2)

    data = d3.range(n).map(()=>0);

var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 20, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

 x = d3.scaleLinear()
    .domain([1, n - 2])
    .range([0, width]);

var y = d3.scaleLinear()
    .domain([-4, 4])
    .range([height, 0]);

 line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d, i) { return x(i); })
    .y(function(d, i) { return y(d); });

g.append("defs").append("clipPath")
    .attr("id", "clip")
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

g.append("g")
    .attr("clip-path", "url(#clip)")
  .append("path")
    .datum(data)
    .attr("class", "line")
  .transition()
    .duration(15)
    .ease(d3.easeLinear)
    .on("start", tick);
}


function tick() {
    //random = d3.randomNormal(0, .2),

    if(databuffer.length == 0) { databuffer.push({ts:new Date(),z:1})}; //Add a 0 to scroll it off
    datapoint = databuffer.shift().z-1

    // Push a new data point onto the back.
    data.push(datapoint);
    //console.log(datapoint)
    // Redraw the line.
    d3.select(this)
        .attr("d", line)
        .attr("transform", null);
  
    // Slide it to the left.
    d3.active(this)
        .attr("transform", "translate(" + x(0) + ",0)")
      .transition()
        .on("start", tick);
  
    // Pop the old data point off the front. 
    data.shift();
    
  
  }



async function onLoad() {
    vueapp = initVue()
    await initRealm()
    if (realmapp.currentUser) { vueapp.message = realmapp.currentUser.id }
    initd3()

    //Get some data
    updateData();
}

async function updateData() {

    user = realmapp.currentUser;
    const result = await user.functions.getData(lastSeen);
    if(result.data.length > 0) { lastSeen = result.data[0].ts } //Watch for empty
    databuffer = databuffer.concat(result.data.reverse())
   // console.log(databuffer.length)
    setTimeout( updateData,1);
}