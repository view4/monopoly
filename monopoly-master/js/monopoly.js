var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 400;
Monopoly.isDouble = false;

//calls various functions for the init
Monopoly.init = function () {
    $(document).ready(function () {
        Monopoly.adjustBoardSize();
        $(window).bind("resize", Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();
    });
};
//displays opening message via showPopup method
Monopoly.start = function () {
    Monopoly.showPopup("intro")
};

//adds event listener to the dice, only rolls when allowRoll is true.
Monopoly.initDice = function () {
    $(".dice").click(function () {
        if (Monopoly.allowRoll) {
            Monopoly.rollDice();
        }
    });
};

// access the player/object who's current turn it is via the class name'
Monopoly.getCurrentPlayer = function () {
    var current = $(".player.current-turn");


    return $(".player.current-turn");
};

Monopoly.getPlayersCell = function (player) {
    return player.closest(".cell");
};

//accesss the money of a player (taken as a parameter) and returns is
Monopoly.getPlayersMoney = function (player) {
    return parseInt(player.attr("data-money"));
};

//Where does player come from.. is it an object?
Monopoly.updatePlayersMoney = function (player, amount) {
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;
    if (playersMoney < 0) {

        Monopoly.removePlayer(player);
         var popup = Monopoly.getPopup("broke");
         popup.find("button").unbind("click").bind("click", function () {
             Monopoly.closePopup();
         });
        Monopoly.showPopup("broke");

    } else {
        player.attr("data-money", playersMoney);
        player.attr("title", player.attr("id") + ": $" + playersMoney);
        Monopoly.playSound("chaching");
    }


};

//takes two random numbers between 1-6.Set its opacity to change thebackground color.
Monopoly.rollDice = function () {
    var result1 = Math.floor(Math.random() * 6) + 1;
    var result2 = Math.floor(Math.random() * 6) + 1;
    $(".dice").find(".dice-dot").css("opacity", 0);

    $(".dice#dice1").attr("data-num", result1).find(".dice-dot.num" + result1).css("opacity", 1);
    $(".dice#dice2").attr("data-num", result2).find(".dice-dot.num" + result2).css("opacity", 1);
    if (result1 == result2) {
        Monopoly.isDouble = true;
    } else {
        Monopoly.isDouble = false;
    }
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer, "move", result1 + result2);
};


Monopoly.movePlayer = function (player, steps) {
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function () {
        if (steps == 0) {
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        } else {
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    }, 200);
};

// on own does not work the first go after buying the proprty, but for subsequent landings. 

///Handles various scenarios and calls other functions. 
Monopoly.handleTurn = function () {
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    if (playerCell.hasClass(player.attr("id"))) {
        player.addClass("on-own-prop");
    }

    if (playerCell.is(".available.property")) {
        Monopoly.handleBuyProperty(player, playerCell);
    } else if (playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))) {
        Monopoly.handlePayRent(player, playerCell);
    } else if (playerCell.is(".go-to-jail")) {
        Monopoly.handleGoToJail(player);
    } else if (playerCell.is(".chance")) {
        Monopoly.handleChanceCard(player);
    } else if (playerCell.is(".community")) {
        Monopoly.handleCommunityCard(player);
    } else {
        Monopoly.setNextPlayerTurn();
    }
}
//Gos to next player, checks if curent player is out and also there is a chck if there is a double to stay on the same player
Monopoly.setNextPlayerTurn = function () {
    var currentPlayerTurn = Monopoly.getCurrentPlayer();

    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player", ""));
    var check = playerId;

    var nextPlayerId = playerId + 1;

    if (nextPlayerId > $(".player").length) {
        nextPlayerId = 1;
    } else if (Monopoly.isDouble) {
        nextPlayerId = playerId;
    }
    currentPlayerTurn.removeClass("current-turn");
    var nextPlayer = $(".player#player" + nextPlayerId);
    while (nextPlayer.is(".broke")) {
        nextPlayerId++
        var nextPlayer = $(".player#player" + nextPlayerId);
        if (nextPlayerId > $(".player").length) {
            nextPlayerId = 1;
        }
        if ($(".broke").length == ($(".player").length - 1)) {
            alert("Game has been completed congrats!")
        }
    }
    nextPlayer.addClass("current-turn");
    if (nextPlayer.is(".jailed")) {
        var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
        currentJailTime++;
        nextPlayer.attr("data-jail-time", currentJailTime);
        if (currentJailTime > 3) {
            nextPlayer.removeClass("jailed");
            nextPlayer.removeAttr("data-jail-time");
        }
        Monopoly.setNextPlayerTurn();
        return;
    }
    Monopoly.closePopup();
    Monopoly.allowRoll = true;
};


Monopoly.handleBuyProperty = function (player, propertyCell) {
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click", function () {
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")) {
            Monopoly.handleBuy(player, propertyCell, propertyCost);
        } else {
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};

Monopoly.handlePayRent = function (player, propertyCell) {
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click", function () {
        var properyOwner = $(".player#" + properyOwnerId);
        Monopoly.updatePlayersMoney(player, currentRent);
        Monopoly.updatePlayersMoney(properyOwner, -1 * currentRent);
        Monopoly.closeAndNextTurn();
    });
    Monopoly.showPopup("pay");
};

//handle go to jail.
Monopoly.handleGoToJail = function (player) {
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click", function () {
        Monopoly.handleAction(player, "jail");
        player.className += "in-jail";
    });
    Monopoly.showPopup("jail");
};

//accesses the handle cardy via a get request.
Monopoly.handleChanceCard = function (player) {
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function (chanceJson) {
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", chanceJson["action"]).attr("data-amount", chanceJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("chance");
};

Monopoly.handleCommunityCard = function (player) {
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function (comJson) {
        popup.find(".popup-content #text-placeholder").text(comJson["content"]);
        popup.find(".popup-title").text(comJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", comJson["action"]).attr("data-amount", comJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("community");
};

//changes the class for the piece to go to jail. and 
Monopoly.sendToJail = function (player) {
    player.addClass("jailed");
    player.attr("data-jail-time", 1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};


Monopoly.getPopup = function (popupId) {
    return $(".popup-lightbox .popup-page#" + popupId);
};

Monopoly.calculateProperyCost = function (propertyCell) {
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group", "")) * 5;
    if (cellGroup == "rail") {
        cellPrice = 10;
    }
    return cellPrice;
};


Monopoly.calculateProperyRent = function (propertyCost) {
    return propertyCost / 2;
};


Monopoly.closeAndNextTurn = function () {
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};
//Initialising op ups, adding click functions to the buttons
Monopoly.initPopups = function () {
    $(".popup-page#intro").find("button").click(function () {
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers", numOfPlayers)) {
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};


Monopoly.handleBuy = function (player, propertyCell, propertyCost) {
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost) {
        Monopoly.playSound("error");
        Monopoly.showErrorMsg();
    } else {
        Monopoly.updatePlayersMoney(player, propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
            .addClass(player.attr("id"))
            .attr("data-owner", player.attr("id"))
            .attr("data-rent", rent);
        Monopoly.setNextPlayerTurn();
    }
};





Monopoly.handleAction = function (player, action, amount) {
    switch (action) {
        case "move":
            Monopoly.movePlayer(player, amount);
            break;
        case "pay":
            Monopoly.updatePlayersMoney(player, amount);
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    Monopoly.closePopup();
};




Monopoly.createPlayers = function (numOfPlayers) {
    var startCell = $(".go");
    for (var i = 1; i <= numOfPlayers; i++) {
        var player = $("<div />").addClass("player shadowed").attr("id", "player" + i).attr("title", "player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i == 1) {
            player.addClass("current-turn");
        }
        player.attr("data-money", Monopoly.moneyAtStart);
    }
};
Monopoly.removePlayer = function (player) {
    player.addClass("broke");

}



Monopoly.getNextCell = function (cell) {
    var currentCellId = parseInt(cell.attr("id").replace("cell", ""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40) {
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};


Monopoly.handlePassedGo = function () {
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player, Monopoly.moneyAtStart/-10);
};


Monopoly.isValidInput = function (validate, value) {
    var isValid = false;
    switch (validate) {
        case "numofplayers":
            if (value > 1 && value <= 4) {
                isValid = true;
            }
    }
    if (!isValid) {
        Monopoly.showErrorMsg();
    }
    return isValid;

}

Monopoly.showErrorMsg = function () {
    $(".popup-page .invalid-error").fadeTo(500, 1);
    setTimeout(function () {
        $(".popup-page .invalid-error").fadeTo(500, 0);
    }, 2000);
};


Monopoly.adjustBoardSize = function () {
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(), $(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) * 2;
    $(".board").css({ "height": boardSize, "width": boardSize });
}

Monopoly.closePopup = function () {
    $(".popup-lightbox").fadeOut();
};

Monopoly.playSound = function (sound) {
    var snd = new Audio("./sounds/" + sound + ".wav");
    snd.play();
}

Monopoly.showPopup = function (popupId) {
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();