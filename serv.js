
export const { pointsOnPath } = require('points-on-path');
export const { parse } = require('svg-parser');
export const svgson = require('svgson')

const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

app.use(cors())

var port = 3000;
var host = "localhost";

// read arguments
for(var i = 0;i < process.argv.length; i++)
{
    var arg = process.argv[i];
    if (arg.startsWith('host') && i + 1 < process.argv.length)
    {
        host = process.argv[i + 1];
    }
    else if (arg.startsWith('port') && i + 1 < process.argv.length)
    {
        port = parseInt(process.argv[i + 1]);
    }
}

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json({
     type: 'application/json'
}));
app.use(bodyParser.text({
    type: 'image/svg+xml'
}));

app.get("/TEST", (req, res) => {
    var pathData = 'M2,10 c2.5,0 10-4.5 10,-10 h11';
    var points = pointsOnPath(pathData, 0.001);
    res.setHeader('Content-Type', 'application/json');
    res.send(points);
});

app.post("/getpolygon", (req,res) => {
    console.log(req.body);
    console.log(req.body.data);
    var data = "";
    if (typeof req.body.data === "undefined")
        data = "";
    else
        data = req.body.data;

    var tolerance = 0.0001;
    if (typeof req.body.tolerance === "undefined")
        tolerance = 0.0001;
    else
        tolerance = req.body.tolerance;
    console.log(tolerance);

    try {
        var points = pointsOnPath(data, tolerance);
        console.log(JSON.stringify(points))
        res.send(JSON.stringify(points));
    } catch (error) {
        console.log(error);
        res.send('[]');
    }
    res.send(req.body.name);
});

app.post("/parsesvg", (req,res) => {
    console.log(req.body);
    var data = req.body;
    var svg = parse(data);

    res.send(JSON.stringify(svg));
});

app.post("/getpolygonfromapath", (req,res) => {
    var tolerance = 0.0001;
    if (typeof req.query.tolerance === "undefined")
        tolerance = 0.0001;
    else
        tolerance = req.query.tolerance;

    console.log(req.body);
    var data = req.body;
    var svg = parse(data);

    var data = svg.children[0].children[0].properties.d;
    var points = pointsOnPath(data, tolerance);
    console.log(JSON.stringify(points))
    res.send(JSON.stringify(points));
});

app.post("/sample.svg", async (req,res) => {
    var tolerance = 0.0001;
    if (typeof req.query.tolerance === "undefined")
        tolerance = 0.0001;
    else
        tolerance = req.query.tolerance;

    console.log(req.body);
    var data = req.body;
    var svg = parse(data);
    var svg2 = {};
    await svgson.parse(data).then((json) => {
        svg2 = json;
        console.log(svg2);
    });

    // res.send(JSON.stringify(svg));
    var data = svg2.children[0].attributes.d;//svg.children[0].children[0].properties.d;
    try {
        var points = pointsOnPath(data, tolerance);
        var strPoints = "";
        for (var i = 0; i < points[0].length; i++) {
            strPoints += points[0][i][0].toString();
            strPoints += ",";
            strPoints += points[0][i][1].toString();
            strPoints += " ";
        }
        var newElement = {
            name: "polygon",
            type: "element",
            value: "",
            attributes: {
                points: strPoints,
                style: "stroke:red;stroke-width:3;fill:none;"
            }
        };
        svg2.children[0] = newElement;
        try {
            delete svg2.children[1]
        } catch (err2) {}

        var mysvg = svgson.stringify(svg2);
        res.set('Content-Type', 'image/svg+xml');
        res.send(mysvg);
    } catch (err) {
        console.log(JSON.stringify(points));
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(points));
    }
});

// routing for the static files
app.use(express.static(path.join(__dirname, 'public')));


var startListen = () => {
    app.listen(
        port,
        host,
        () => console.log(`app listening on port ${host}:${port}!`))
        .on('error', (err) => {
            console.log(err.name + ': ' + err.message);
            port++;
            startListen();
        });
    };

startListen();

