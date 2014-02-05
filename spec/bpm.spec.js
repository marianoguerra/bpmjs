/*global define, describe, it, expect*/
define(['src/bpm', 'text!test-data/rfp.bpmn'], function (bpm, rfpXml) {
    'use strict';

    describe('bpmjs', function () {

        it('should have a parseXml function', function () {
            expect(typeof bpm.parseXml).toEqual("function");
        });

    });
});
