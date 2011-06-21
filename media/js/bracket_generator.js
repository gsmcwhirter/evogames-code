function BracketGenerator(type, target){
    if (type == "single" || type == "double"){
        this.type = type;
        this.target = target || "body";
    }
    else {
        throw "unknown type";
    }
}

BracketGenerator.prototype.draw = function(data, target){
    target = target || this.target;
    if (this.type == "single"){
        this._drawSingle(data, target);
    }
    else if (this.type == "double"){
        this._drawDouble(data, target);
    }
}

/* Data format:
 *
 * {rounds: [
 *      {matches: [
 *
 *      ]},
 *      {matches: [
 *
 *      ]},
 *      {matches: [
 *
 *      ]},
 *
 * ]}
 *
 */

BracketGenerator.prototype._drawSingle = function (data, target){
    var roundct = data.rounds.length;
    target = $(target);
    
    var matchDivsByRound = [];
    var vOffset;
    var alignTo;

    for (var roundIndex=0; roundIndex< roundct; roundIndex++) {
        var round = data.rounds[roundIndex];

        var bracket = $("<div class='bracket' />");
        target.append(bracket);

        var matchDivs = [];
        matchDivsByRound.push(matchDivs);


        //setup the match boxes round by round
        for (var i=0, matchct = round.matches.length; i < matchct; i++) {
            vOffset = $("<div />");
            bracket.append(vOffset);

            var match = round.matches[i];

            var matchDiv = $("<div class='match' id='match"+match.id+"'><div class='p1'>"+(match.p1 || "")+"</div><div class='spacer'></div><div class='p2'>"+(match.p2 || "")+"</div></div>");
            bracket.append(matchDiv);
            matchDivs.push(matchDiv);

            if (roundIndex > 0){
                alignTo = matchDivsByRound[roundIndex - 1][i*2];
                var desiredOffset = alignTo.position().top - matchDiv.position().top;

                desiredOffset += alignTo.height() / 2;
                vOffset.height(desiredOffset);

                var stretchTo = matchDivsByRound[roundIndex - 1][i * 2 + 1];
                var newH = stretchTo.position().top + stretchTo.height() / 2 - matchDiv.position().top;
                var deltaH = newH - matchDiv.height();

                matchDiv.height(newH);
                var spacer = matchDiv.find(".spacer");
                spacer.height(spacer.height() + deltaH);
            }
            else {
                bracket.append("<div class='small-spacer'></div>");
            }
        }
    }

    //setup the final winners box; just a space for a name whose bottom is centrally aligned with the last match
    bracket = $("<div class='bracket' />");
    target.append(bracket);

    vOffset = $("<div />");
    bracket.append(vOffset);

    alignTo = matchDivsByRound[roundct - 1][0];

    var winnerDiv = $("<div class='winner'></div>");
    bracket.append(winnerDiv);
    vOffset.height(alignTo.position().top - winnerDiv.position().top + alignTo.height() / 2 - winnerDiv.height());
}

BracketGenerator.prototype._drawDouble = function (data, target){
    
}