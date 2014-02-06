/*global define, window*/
define([], function () {
    "use strict";
    var DI_NS = "http://www.omg.org/spec/BPMN/20100524/DI",
        DI1_NS = "http://www.omg.org/spec/DD/20100524/DI",
        DC_NS = "http://www.omg.org/spec/DD/20100524/DC",
        MODEL_NS = "http://www.omg.org/spec/BPMN/20100524/MODEL",

        SHAPE = "BPMNShape",
        EDGE = "BPMNEdge",
        BOUNDS = "Bounds",
        WAYPOINT = "waypoint",
        CONN_TYPES = ["sequenceFlow"],
        MODELS = {
            "exclusiveGateway": ["id", "name", "default", "gatewayDirection"],
            "inclusiveGateway": ["id", "name", "default", "gatewayDirection"],
            "parallelGateway": ["id", "name", "gatewayDirection"],
            "eventBasedGateway": ["id", "name", "gatewayDirection"],

            "sequenceFlow": ["id", "name", "sourceRef", "targetRef",
                "isImmediate"],

            "laneSet": ["id"],
            "lane": ["id", "name"],

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

    function xmlToWayPoint(node) {
        return [attrToFloatOr(node, "x", 0.0), attrToFloatOr(node, "y", 0.0)];
    }

    function xmlToEdge(node) {
        var id = node.getAttribute("id"),
            bpmnElement = node.getAttribute("bpmnElement"),
            waypoints = map(node.getElementsByTagNameNS(DI1_NS, WAYPOINT),
                            xmlToWayPoint);

        return {
            id: id,
            bpmnElement: bpmnElement,
            waypoints: waypoints
        };
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

    function endsWith(str, searchString, position) {
        position = position || str.length;
        position = position - searchString.length;
        var lastIndex = str.lastIndexOf(searchString);
        return lastIndex !== -1 && lastIndex === position;
    }

    function parseBpmn(xml) {
        var seqFlows, shapes, edges, type, node, nodes, i, len,
            maxX = null, minX = null, maxY = null, minY = null,
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
        edges = map(doc.getElementsByTagNameNS(DI_NS, EDGE), xmlToEdge);

        edges.forEach(function (edge) {
            var conn = byId[edge.bpmnElement];

            if (conn) {
                // add intermediate edges here, later we will add the first
                // and last step from source and target
                conn.edges = edge.waypoints.slice();
            } else if (window.console) {
                window.console.warn("conn for edge not found", edge, conn);
            }
        });

        shapes.forEach(function (shape) {
            var model = byId[shape.bpmnElement],
                rightX = shape.x + shape.width,
                bottomY = shape.y + shape.height;

            if (maxX === null || rightX > maxX) {
                maxX = rightX;
            }

            if (maxY === null || bottomY > maxY) {
                maxY = bottomY;
            }

            if (minX === null || shape.x < minX) {
                minX = shape.x;
            }

            if (minY === null || shape.y < minY) {
                minY = shape.y;
            }

            if (model) {
                model.shape = shape;
                shape.nodeType = model.nodeType;

                shape.isGateway = endsWith(shape.nodeType, "Gateway");
                shape.isTask = endsWith(shape.nodeType, "Task");
            } else if (window.console) {
                window.console.warn("model for shape not found", shape, model);
            }
        });

        connections.forEach(function (conn) {
            var line, shape1, shape2, x1, y1, x2, y2, source, target,
                edge1, edge2, edges, edgeCount, middle;

            if (!conn.edges) {
                if (window.console) {
                    window.console.warn("no edges for connection, calculating",
                                        conn);
                }

                source = byId[conn.sourceRef];
                target = byId[conn.targetRef];

                if (!source || !target) {
                    if (window.console) {
                        window.console.error("source or target not found", conn,
                                             source, target);
                    }

                    return;
                }

                shape1 = source.shape;
                shape2 = target.shape;

                x1 = shape1.x + shape1.width / 2;
                y1 = shape1.y + shape1.height / 2;

                x2 = shape2.x + shape2.width / 2;
                y2 = shape2.y + shape2.height / 2;

                conn.edges = [[x1, y1], [x2, y2]];
            }

            edges = conn.edges;
            edgeCount = edges.length;
            if (edgeCount === 2) {
                edge1 = edges[0];
                edge2 = edges[1];

                conn.cx = (edge1[0] + edge2[0]) / 2;
                conn.cy = (edge1[1] + edge2[1]) / 2;
            } else if (edgeCount > 2) {
                middle = Math.floor(edgeCount / 2);
                edge1 = edges[middle];

                if (edgeCount % 2 === 0) {
                    edge2 = edges[middle + 1];
                    conn.cx = (edge1[0] + edge2[0]) / 2;
                    conn.cy = (edge1[1] + edge2[1]) / 2;
                } else {
                    conn.cx = edge1[0];
                    conn.cy = edge1[1];
                }

            } else if (window.console) {
                window.console.warn("no enough edges?", conn);
            }
        });

        return {
            byId: byId,
            byType: byType,
            shapes: shapes,
            edges: edges,
            connections: connections,
            stats: {
                maxX: maxX,
                minX: minX,
                maxY: maxY,
                minY: minY,
                relativeWidth: maxX - minX,
                relativeHeight: maxY - minY
            }
        };
    }

    function scaleToFit(data, height, width, mantainAspectRatio, offsetX, offsetY) {
        offsetX = typeof offsetX === "number" ? offsetX : 10;
        offsetY = typeof offsetY === "number" ? offsetY : 10;

        var factorX = width / ((data.stats.relativeWidth || 1) + offsetX),
            factorY = height / ((data.stats.relativeHeight || 1) + offsetY),
            minX = data.stats.minX,
            minY = data.stats.minY;

        if (mantainAspectRatio) {
            factorX = factorY = Math.min(factorX, factorY);
        }

        data.shapes.forEach(function (shape) {
            shape.x -= minX;
            shape.x *= factorX;

            shape.y -= minY;
            shape.y *= factorY;

            shape.x += offsetX;
            shape.y += offsetY;

            shape.width *= factorX;
            shape.height *= factorY;
        });

        data.connections.forEach(function (conn) {
            conn.cx = ((conn.cx - minX) * factorX) + offsetX;
            conn.cy = ((conn.cy - minY) * factorY) + offsetY;
            conn.edges.forEach(function (edge) {
                edge[0] = ((edge[0] - minX) * factorX) + offsetX;
                edge[1] = ((edge[1] - minY) * factorY) + offsetY;

            });
        });
    }

    return {
        parseBpmn: parseBpmn,
        scaleToFit: scaleToFit
    };
});
