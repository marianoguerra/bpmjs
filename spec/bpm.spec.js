/*global define*/
define(['src/bpm'], function(bpm) {
    'use strict';

    describe('bpmjs', function() {

        it('should have a parseXml function', function() {
            expect(typeof bpm.parseXml).toEqual("function");
        });

    });
});
