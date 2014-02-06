/*global require, document, window, console*/
require.config({
    baseUrl: "src",
    paths: {
        svg: "../lib/svg",
    }
});

require(["bpm", "svg"], function (bpm, mSVG) {
    "use strict";
    var bpmFile = document.getElementById("bpm-file"),
        bpmSubmit = document.getElementById("bpm-submit"),
        outputText = document.getElementById("json-output"),
        outputXml = document.getElementById("xml-output"),
        outputImage = document.getElementById("image-output"),

        SYMBOL_FOR_TYPE = {
            "exclusiveGateway": "x",
            "inclusiveGateway": "o",
            "parallelGateway": "+",
            "eventBasedGateway": "^",
        };

    function draw(data, width, height) {
        var paper = mSVG("image-output").size(width, height),
            fontSize = 10;

        bpm.scaleToFit(data, width, height, true);

        data.byType.laneSet.forEach(function (model) {
            var rect, shape = model.shape;

            if (shape) {
                rect = paper.rect(shape.width, shape.height)
                            .move(shape.x, shape.y)
                            .stroke({width: 1})
                            .fill("#fefefe");
            } else {
                console.error("no shape for model", model);
            }
        });

        data.byType.lane.forEach(function (model) {
            var rect, shape = model.shape;

            if (shape) {
                rect = paper.rect(shape.width, shape.height)
                            .move(shape.x, shape.y)
                            .stroke({width: 1})
                            .fill("#fdfdfd");
            } else {
                console.error("no shape for model", model);
            }
        });

        data.connections.forEach(function (connection) {
            paper.polyline(connection.edges)
                .fill("none")
                .stroke({width: 1, color: "#555"});

            if (connection.name) {
                paper.text(connection.name)
                    .font({family: 'Helvetica', size: fontSize})
                    .center(connection.cx, connection.cy - 10);
            }
        });


        data.shapes.forEach(function (shape) {
            if (shape.nodeType && shape.nodeType !== "lane" &&
                    shape.nodeType !== "laneSet") {
                var isStart = shape.nodeType === "startEvent",
                    isEnd = shape.nodeType === "endEvent",
                    circleStroke = isEnd ? "#902226" : "#96A826",
                    circleFill = isEnd ? "#FEF4F2" : "#EFF1C4",
                    circleStrokeWidth = isStart || isEnd ? 2 : 1;

                if (isStart || isEnd || shape.isGateway) {
                    paper.circle(shape.width)
                        .move(shape.x, shape.y)
                        .stroke({width: circleStrokeWidth, color: circleStroke})
                        .fill(circleFill);

                    if (!isStart && !isEnd) {
                        paper.text(SYMBOL_FOR_TYPE[shape.nodeType] || "")
                            .font({family: 'Helvetica', size: fontSize})
                            .stroke({color: "#96A826"})
                            .center(shape.x + (shape.width / 2),
                                    // width again since it's a circle
                                    shape.y + (shape.width / 2));
                    }
                } else {
                    paper.rect(shape.width, shape.height)
                        .radius(1)
                        .move(shape.x, shape.y)
                        .stroke({width: 1, color: "#3875A8"})
                        .fill("#ECEDF5");

                    paper.text(shape.nodeType.replace("Task", ""))
                        .font({family: 'Helvetica', size: fontSize})
                        .center(shape.x + (shape.width / 2),
                                shape.y + (shape.height / 2));
                }
            }
        });
    }

    function onBpmSubmit() {
        var file,
            input = document.getElementById("meteo-file"),
            reader = new window.FileReader();

        function onXmlReady(event) {
            var text = event.target.result,
                data = bpm.parseBpmn(text);

            outputXml.textContent = text;
            outputText.textContent = JSON.stringify(data, null, 2);
            outputImage.innerHTML = "";
            draw(data, Math.max(1024, data.stats.maxX),
                 Math.max(1024, data.stats.maxY));
        }

        if (bpmFile.files && bpmFile.files[0]) {
            file = bpmFile.files[0];

            reader.onload = onXmlReady;

            reader.readAsText(file);
        } else {
            window.alert("No file selected");
        }
    }

    bpmSubmit.addEventListener("click", onBpmSubmit);

});
