/**
 * Copyright 2013, 2015 IBM Corp.
 * Copyright 2016 Dean Cording
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var operators = {
        'eq': function(a, b) { return a == b; },
        'neq': function(a, b) { return a != b; },
        'lt': function(a, b) { return a < b; },
        'lte': function(a, b) { return a <= b; },
        'gt': function(a, b) { return a > b; },
        'gte': function(a, b) { return a >= b; },
        'btwn': function(a, b, c) { return a >= b && a <= c; },
        'cont': function(a, b) { return (a + "").indexOf(b) != -1; },
        'regex': function(a, b, c, d) { return (a + "").match(new RegExp(b,d?'i':'')); },
        'true': function(a) { return a === true; },
        'false': function(a) { return a === false; },
        'null': function(a) { return (typeof a == "undefined" || a === null); },
        'nnull': function(a) { return (typeof a != "undefined" && a !== null); },
        'type': function(a, b) { if (b == "array") return Array.isArray(a); else if (b == "buffer") return Buffer.isBuffer(a); else return (typeof a == b) && !Array.isArray(a) && !Buffer.isBuffer(a); }
    };

    var operatorsDesc = {
        'eq': function(a, b) { return "" + a +  "==" + b; },
        'neq': function(a, b) { return "" + a + "!=" + b; },
        'lt': function(a, b) { return "" + a + "<" + b; },
        'lte': function(a, b) { return "" + a + "<=" + b; },
        'gt': function(a, b) { return "" + a + ">" + b; },
        'gte': function(a, b) { return "" + a + ">=" + b; },
        'btwn': function(a, b, c) { return "" + a + " is between " + b + " and " + c; },
        'cont': function(a, b) { return "" + a + " contains " + b; },
        'regex': function(a, b, c, d) { return "" + a + " " + b + " case insensitive: " + d; },
        'true': function(a) { return "" + a + " is true"; },
        'false': function(a) { return "" + a + " is false"; },
        'null': function(a) { return "" + a + " is null"; },
        'nnull': function(a) { return " is not null"; },
        'type': function(a, b) { return (Array.isArray(a)?"array":(Buffer.isBuffer(a)?"buffer":(typeof a))) + " is " + b;}
    };


    function MatchNode(n) {
        RED.nodes.createNode(this, n);
        this.rules = n.rules || [];
        var node = this;
        for (var i=0; i<this.rules.length; i+=1) {
            var rule = this.rules[i];

            rule.propertyType = rule.propertyType || "msg";

            rule.previousValue = null;

            if (!rule.valueType) {
                if (!isNaN(Number(rule.value))) {
                    rule.valueType = 'num';
                } else {
                    rule.valueType = 'str';
                }
            }
            if (rule.valueType === 'num') {
                if (!isNaN(Number(rule.value))) {
                    rule.value = Number(rule.value);
                }
            }
            if (typeof rule.value2 !== 'undefined') {
                if (!rule.value2Type) {
                    if (!isNaN(Number(rule.value2))) {
                        rule.value2Type = 'num';
                    } else {
                        rule.value2Type = 'str';
                    }
                }
                if (rule.value2Type === 'num') {
                    rule.value2 = Number(rule.value2);
                }
            }
        }

        this.on('input', function (msg) {
            try {
                for (var i=0; i<node.rules.length; i+=1) {
                    var rule = node.rules[i];
                    var test = RED.util.evaluateNodeProperty(rule.property,rule.propertyType,node,msg);

                    var v1,v2;
                    if (rule.valueType === 'prev') {
                        v1 = rule.previousValue;
                    } else {
                        v1 = RED.util.evaluateNodeProperty(rule.value,rule.valueType,node,msg);
                    }
                    v2 = rule.value2;
                    if (rule.value2Type === 'prev') {
                        v2 = rule.previousValue;
                    } else if (typeof v2 !== 'undefined') {
                        v2 = RED.util.evaluateNodeProperty(rule.value2,rule.value2Type,node,msg);
                    }

                    if (!(((rule.valueType === 'prev') || (rule.value2Type === 'prev')) && (rule.previousValue == null))) {
                        if (!operators[rule.type](test,v1,v2,rule.case)) {
                            this.status({fill:"red",shape:"dot",text:"Rule " + (i+1) + " failed"});
                            this.send([null, msg]);
                        }
                    }

                    rule.previousValue = test;

                }
                this.status({fill:"green",shape:"dot",text:"ok"});
                this.send([msg, null]);
            } catch(err) {
                node.error(err,msg);
            }
        });
    }
    RED.nodes.registerType("match", MatchNode);
}
