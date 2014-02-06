/*global define, window*/
define([], function () {
    "use strict";
    var DI_NS = "http://www.omg.org/spec/BPMN/20100524/DI",
        DC_NS = "http://www.omg.org/spec/DD/20100524/DC",
        MODEL_NS = "http://www.omg.org/spec/BPMN/20100524/MODEL",

        SHAPE = "BPMNShape",
        BOUNDS = "Bounds",
        LANE_SET = "laneSet",
        LANE = "lane",
        CONN_TYPES = ["sequenceFlow"],
        MODELS = {
            "exclusiveGateway": ["id", "name", "default", "gatewayDirection"],
            "inclusiveGateway": ["id", "name", "default", "gatewayDirection"],
            "parallelGateway": ["id", "name", "gatewayDirection"],
            "eventBasedGateway": ["id", "name", "gatewayDirection"],

            "sequenceFlow": ["id", "name", "sourceRef", "targetRef",
                "isImmediate"],

            "startEvent": ["id", "name"],
            "endEvent": ["id", "name"],
            "task": ["id", "name"],
            "userTask": ["id", "name"],
            "intermediateCatchEvent": ["id", "name"],
            "intermediateThrowEvent": ["id", "name"],
            "scriptTask": ["id", "name"],
            "businessRuleTask": ["id", "name"],
            "manualTask": ["id", "name"],
            "sendTask": ["id", "name"],
            "receiveTask": ["id", "name"],
            "serviceTask": ["id", "name"],
            "subProcess": ["id", "name"],
            "adHocSubProcess": ["id", "name"],
            "callActivity": ["id", "name"]
        };

    function parseXml(data) {
        var xml, tmp;
        if (!data || typeof data !== "string") {
            return null;
        }

        // Support: IE9
        try {
            tmp = new window.DOMParser();
            xml = tmp.parseFromString(data, "text/xml");
        } catch ( e ) {
            xml = undefined;
        }

        if (!xml || xml.getElementsByTagName("parsererror").length) {
            throw new Error("Invalid XML: " + data);
        }

        return xml;
    }

    function xmlToObject(type, fields) {
        return function (node) {
            var i, field,
                len = fields.length,
                result = {nodeType: type};

            for (i = 0; i < len; i += 1) {
                field = fields[i];
                result[field] = node.getAttribute(field) || "";
            }

            return result;
        };
    }

    function attrToFloatOr(node, name, defaultValue) {
        var valFloat, val = node.getAttribute(name);

        if (typeof val === "string") {
            valFloat = parseFloat(val);

            // isNaN
            if (valFloat !== valFloat) {
                return defaultValue;
            } else {
                return valFloat;
            }
        } else {
            return defaultValue;
        }
    }

    function xmlToShape(node) {
        var bounds,
            result = {},
            boundss = node.getElementsByTagNameNS(DC_NS, BOUNDS);

        if (boundss.length > 0) {
            bounds = boundss[0];

            result.x = attrToFloatOr(bounds, "x", 0.0);
            result.y = attrToFloatOr(bounds, "y", 0.0);
            result.width = attrToFloatOr(bounds, "width", 0.0);
            result.height = attrToFloatOr(bounds, "height", 0.0);
            result.hasBounds = true;
        } else {
            result.x = 0.0;
            result.y = 0.0;
            result.width = 0.0;
            result.height = 0.0;
            result.hasBounds = false;
        }

        result.id = node.getAttribute("id");
        result.bpmnElement = node.getAttribute("bpmnElement");
        result.isHorizontal = !!node.getAttribute("isHorizontal");

        return result;
    }

    function map(items, fun) {
        var i, len = items.length,
            result = new Array(len);

        for (i = 0; i < len; i += 1) {
            result[i] = fun(items[i]);
        }

        return result;
    }

    function parseBpmn(xml) {
        var seqFlows, shapes, type, node, nodes, i, len,
            $xml = parseXml(xml),
            doc = $xml.documentElement,
            connections = [],
            byId = {},
            byType = {};

        for (type in MODELS) {
            nodes = map(doc.getElementsByTagNameNS(MODEL_NS, type),
                           xmlToObject(type, MODELS[type]));

            for (i = 0, len = nodes.length; i < len; i += 1) {
                node = nodes[i];
                byId[node.id] = node;

                if (CONN_TYPES.indexOf(node.nodeType) !== -1) {
                    connections.push(node);
                }
            }

            byType[type] = nodes;
        }

        shapes = map(doc.getElementsByTagNameNS(DI_NS, SHAPE), xmlToShape);
        shapes.forEach(function (shape) {
            shape.model = byId[shape.bpmnElement] || null;
        });

        return {
            byId: byId,
            byType: byType,
            shapes: shapes,
            connections: connections
        };
    }

    return {parseBpmn: parseBpmn};
});
