/*global define, describe, it, expect*/
define(['src/bpm', 'text!test-data/rfp.bpmn', 'text!test-data/recruit.bpmn',
        'text!test-data/evaluation.bpmn'],
       function (bpm, rfpXml, recruitXml, evaluationXml) {
    'use strict';

    describe('bpmjs', function () {

        it('should have a parseBpmn function', function () {
            expect(typeof bpm.parseBpmn).toEqual("function");
        });

        it('should parse rfp (bonita) xml', function () {
            var model = bpm.parseBpmn(rfpXml);

            expect(model).toBeDefined();
            expect(model.connections.length).toBe(16);
            expect(model.shapes.length).toBe(17);
            expect(model.byType.userTask.length).toBe(3);
            expect(model.byType.startEvent.length).toBe(1);
            expect(model.byType.endEvent.length).toBe(2);
            expect(model.byType.serviceTask.length).toBe(4);
            expect(model.byType.exclusiveGateway.length).toBe(5);
        });

        it('should parse recruit (bonita) xml', function () {
            var model = bpm.parseBpmn(recruitXml);

            expect(model).toBeDefined();
            expect(model.connections.length).toBe(37);
            expect(model.shapes.length).toBe(39);
            expect(model.byType.startEvent.length).toBe(3);
            expect(model.byType.endEvent.length).toBe(4);
            expect(model.byType.userTask.length).toBe(8);
            expect(model.byType.serviceTask.length).toBe(6);
            expect(model.byType.exclusiveGateway.length).toBe(5);
            expect(model.byType.parallelGateway.length).toBe(4);
        });

        it('should parse evaluation (jboss) xml', function () {
            var model = bpm.parseBpmn(evaluationXml);

            expect(model).toBeDefined();
            expect(model.connections.length).toBe(7);
            expect(model.byType.startEvent.length).toBe(1);
            expect(model.byType.endEvent.length).toBe(1);
            expect(model.byType.userTask.length).toBe(3);
            expect(model.byType.parallelGateway.length).toBe(2);
            expect(model.shapes.length).toBe(7);
        });
    });
});
