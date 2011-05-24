var Script = process.binding('evals').Script;

var isNumber = function (num){
    return !isNaN(parseFloat(num)) && isFinite(num);
}

module.exports = {
    calc: {
        plus: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (isNumber(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (isNumber(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return a1 + a2;
            };
        }
        , minus: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (isNumber(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (isNumber(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return a1 - a2;
            }
        }
        , times: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (isNumber(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (isNumber(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return a1 * a2;
            }
        }
        , div: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (isNumber(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (isNumber(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return a1 / a2;
            }
        }
        , log: function (arg1, arg2){
            if(!arg2)
            {
                arg2 = Math.E;
            }

            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (isNumber(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (isNumber(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return Math.log(a1) / Math.log(a2)
            }
        }
        , pow: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (isNumber(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (isNumber(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return Math.pow(a1, a2);
            }
        }
        , root: function (arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (isNumber(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                if (typeof(arg2) == 'function')
                {
                    a2 = arg2(statline);
                }
                else if (isNumber(arg2))
                {
                    a2 = parseFloat(arg2);
                }
                else
                {
                    a2 = parseFloat(statline[arg2]);
                }
                return Math.pow(a1, 1 / a2);
            }
        }
        , sqrt: function (arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (isNumber(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }
                return Math.sqrt(a1);
            }
        }
    }
    , parseString: function (str){
        return Script.runInNewContext(str, this.calc);
    }
}
