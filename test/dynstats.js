module.exports = {
    "plus": function (assert){
        var ds = require('dynstats');
        var statline = {a: 2, b: 3};
        var test1 = ds.parseString("plus('a','b');");
        assert.equal(test1(statline), 5, 'Adding two indices');
        var test2 = ds.parseString("plus('a','3');");
        assert.equal(test2(statline), 5, 'Adding index and string number');
        var test3 = ds.parseString("plus('a',3);");
        assert.equal(test3(statline), 5, 'Adding index and regular number');
        var test4 = ds.parseString("plus('2','3');");
        assert.equal(test4(statline), 5, 'Adding two string numbers');
        var test5 = ds.parseString("plus(2,3);");
        assert.equal(test5(statline), 5, 'Adding two regular numbers');
        var test6 = ds.parseString("plus('b',plus('a','3'));");
        assert.equal(test6(statline), 8, 'Adding index and function');
        var test7 = ds.parseString("plus(plus('b','3'),'2');");
        assert.equal(test7(statline), 8, 'Adding function and number')
        var test8 = ds.parseString("plus(plus('a','2'),plus('b','3'));");
        assert.equal(test8(statline), 10, 'Adding two functions');
    }
    , "minus": function (assert){
        var ds = require('dynstats');
        var statline = {a: 2, b: 3};
        var test1 = ds.parseString("minus('a','b');");
        assert.equal(test1(statline), -1, 'Subtracting two indices');
        var test2 = ds.parseString("minus('a','3');");
        assert.equal(test2(statline), -1, 'Substracting index and string number');
        var test3 = ds.parseString("minus('a',3);");
        assert.equal(test3(statline), -1, 'Substracting index and regular number');
        var test4 = ds.parseString("minus('2','3');");
        assert.equal(test4(statline), -1, 'Substracting two string numbers');
        var test5 = ds.parseString("minus(2,3);");
        assert.equal(test5(statline), -1, 'Substracting two regular numbers');
        var test6 = ds.parseString("minus('b',minus('a','3'));");
        assert.equal(test6(statline), 4, 'Substracting index and function');
        var test7 = ds.parseString("minus(minus('b','3'),'2');");
        assert.equal(test7(statline), -2, 'Substracting function and number')
        var test8 = ds.parseString("minus(minus('a','2'),minus('b','3'));");
        assert.equal(test8(statline), 0, 'Substracting two functions');
    }
    , "times": function (assert){
        var ds = require('dynstats');
        var statline = {a: 2, b: 3};
        var test1 = ds.parseString("times('a','b');");
        assert.equal(test1(statline), 6, 'Multiplying two indices');
        var test2 = ds.parseString("times('a','3');");
        assert.equal(test2(statline), 6, 'Multiplying index and string number');
        var test3 = ds.parseString("times('a',3);");
        assert.equal(test3(statline), 6, 'Multiplying index and regular number');
        var test4 = ds.parseString("times('2','3');");
        assert.equal(test4(statline), 6, 'Multiplying two string numbers');
        var test5 = ds.parseString("times(2,3);");
        assert.equal(test5(statline), 6, 'Multiplying two regular numbers');
        var test6 = ds.parseString("times('b',times('a','3'));");
        assert.equal(test6(statline), 18, 'Multiplying index and function');
        var test7 = ds.parseString("times(times('b','3'),'2');");
        assert.equal(test7(statline), 18, 'Multiplying function and number')
        var test8 = ds.parseString("times(times('a','2'),times('b','3'));");
        assert.equal(test8(statline), 36, 'Multiplying two functions');
    }
    , "div": function (assert){
        var ds = require('dynstats');
        var statline = {a: 24, b: 3};
        var test1 = ds.parseString("div('a','b');");
        assert.equal(test1(statline), 8, 'Dividing two indices');
        var test2 = ds.parseString("div('a','3');");
        assert.equal(test2(statline), 8, 'Dividing index and string number');
        var test3 = ds.parseString("div('a',3);");
        assert.equal(test3(statline), 8, 'Dividing index and regular number');
        var test4 = ds.parseString("div('2','3');");
        assert.equal(test4(statline), 2/3, 'Dividing two string numbers');
        var test5 = ds.parseString("div(2,3);");
        assert.equal(test5(statline), 2/3, 'Dividing two regular numbers');
        var test6 = ds.parseString("div('b',div('a','3'));");
        assert.equal(test6(statline), 3/8, 'Dividing index and function');
        var test7 = ds.parseString("div(div('b','3'),'2');");
        assert.equal(test7(statline), 1/2, 'Dividing function and number')
        var test8 = ds.parseString("div(div('a','2'),div('b','3'));");
        assert.equal(test8(statline), 12, 'Dividing two functions');
    }
    , "log": function (assert){
        var ds = require('dynstats');
        var statline = {a: 27, b: 3};
        var test1 = ds.parseString("log('a','b');");
        assert.equal(test1(statline), 3, 'Logarithm of two indices');
        var test2 = ds.parseString("log('a','3');");
        assert.equal(test2(statline), 3, 'Logarithm of index and string number');
        var test3 = ds.parseString("log('a',3);");
        assert.equal(test3(statline), 3, 'Logarithm of index and regular number');
        var test4 = ds.parseString("log('27','3');");
        assert.equal(test4(statline), 3, 'Logarithm of two string numbers');
        var test5 = ds.parseString("log(27,3);");
        assert.equal(test5(statline), 3, 'Logarithm of two regular numbers');
        var test6 = ds.parseString("log('b',log('a','3'));");
        assert.equal(test6(statline), 1, 'Logarithm of index and function');
        var test7 = ds.parseString("log(log('b','3'),'2');");
        assert.equal(test7(statline), 0, 'Logarithm of function and number')
        var test8 = ds.parseString("log(log('b','3'),log('a','3'));");
        assert.equal(test8(statline), 0, 'Logarithm of two functions');
        var test9 = ds.parseString("log('a');");
        assert.equal(test9({a: Math.E}), 1, 'Logarithm with base E default');

    }
    , "pow": function (assert){
        var ds = require('dynstats');
        var statline = {a: 2, b: 3};
        var test1 = ds.parseString("pow('a','b');");
        assert.equal(test1(statline), 8, 'Power of two indices');
        var test2 = ds.parseString("pow('a','3');");
        assert.equal(test2(statline), 8, 'Power of index and string number');
        var test3 = ds.parseString("pow('a',3);");
        assert.equal(test3(statline), 8, 'Power of index and regular number');
        var test4 = ds.parseString("pow('2','3');");
        assert.equal(test4(statline), 8, 'Power of two string numbers');
        var test5 = ds.parseString("pow(2,3);");
        assert.equal(test5(statline), 8, 'Power of two regular numbers');
        var test6 = ds.parseString("pow('b',pow('a','1'));");
        assert.equal(test6(statline), 9, 'Power of index and function');
        var test7 = ds.parseString("pow(pow('b','2'),'2');");
        assert.equal(test7(statline), 81, 'Power of function and number')
        var test8 = ds.parseString("pow(pow('b','2'),pow('a','1'));");
        assert.equal(test8(statline), 81, 'Power of two functions');
    }
    , "root": function (assert){
        var ds = require('dynstats');
        var statline = {a: 27, b: 3};
        var test1 = ds.parseString("root('a','b');");
        assert.equal(test1(statline), 3, 'Root of two indices');
        var test2 = ds.parseString("root('a','3');");
        assert.equal(test2(statline), 3, 'Root of index and string number');
        var test3 = ds.parseString("root('a',3);");
        assert.equal(test3(statline), 3, 'Root of index and regular number');
        var test4 = ds.parseString("root('27','3');");
        assert.equal(test4(statline), 3, 'Root of two string numbers');
        var test5 = ds.parseString("root(27,3);");
        assert.equal(test5(statline), 3, 'Root of two regular numbers');
        var test6 = ds.parseString("root('a',root('b','1'));");
        assert.equal(test6(statline), 3, 'Root of index and function');
        var test7 = ds.parseString("root(root('a','3'),'2');");
        assert.equal(test7(statline), Math.sqrt(3), 'Root of function and number')
        var test8 = ds.parseString("root(root('a','3'),root('2','1'));");
        assert.equal(test8(statline), Math.sqrt(3), 'Root of two functions');
    }
    , "sqrt": function (assert){
        var ds = require('dynstats');
        var statline = {a: 16, b: 81};
        var test1 = ds.parseString("sqrt('a');");
        assert.equal(test1(statline), 4, 'Sqrt of index');;
        var test4 = ds.parseString("sqrt('25');");
        assert.equal(test4(statline), 5, 'Sqrt of string number');
        var test5 = ds.parseString("sqrt(25);");
        assert.equal(test5(statline), 5, 'Sqrt of regular number');
        var test6 = ds.parseString("sqrt(sqrt('a'));");
        assert.equal(test6(statline), 2, 'Sqrt of function');
    }
}
