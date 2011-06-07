mathlexer = {
    parseStringRep: function (stringrep){
        var _resultfunc = this._calc(stringrep);

        return function (values){
            if (typeof(values) != "object"){
                return undefined;
            }
            else {
                return _resultfunc(values);
            }
        }
    },

    _calc: function (str){
        function idem(arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                return a1;
            }
        }

        function plus(arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
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
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
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

        function minus(arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
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
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
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
        
        function times(arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
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
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
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
        
        function div(arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
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
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
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
        
        function log(arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
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
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
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

        function ln(arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                return Math.log(a1);
            }
        }

        function pow(arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
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
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
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

        function exp(arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                return Math.exp(a1);
            }
        }

        function root(arg1, arg2){
            return function (statline){
                var a1, a2;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
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
                else if (!isNaN(parseFloat(arg2)) && isFinite(arg2))
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
        
        function sqrt(arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
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
        
        function abs(arg1){
            return function (statline){
                var a1;
                if (typeof(arg1) == 'function')
                {
                    a1 = arg1(statline);
                }
                else if (!isNaN(parseFloat(arg1)) && isFinite(arg1))
                {
                    a1 = parseFloat(arg1);
                }
                else
                {
                    a1 = parseFloat(statline[arg1]);
                }

                return Math.abs(a1);
            }
        }

        return eval(str);
    }
}