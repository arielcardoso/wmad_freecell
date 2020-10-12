// Constants
let SUITS = ['hearts', 'spades', 'diamonds', 'clubs'];
let SUIT_COLOR_ACCEPT = {
    'hearts' : ['clubs', 'spades'],
    'spades' : ['diamonds', 'hearts'],
    'diamonds' : ['clubs', 'spades'],
    'clubs' : ['diamonds', 'hearts'],
};
let MOVS = 0;
let TIME = 0;

$(document).ready(function(){
    startScreen();
    $("#btnStartGame").on("click", gameInit);
    $("#btnRestartGame").on("click", startGame);
})

function gameInit() {
    startGame();

    $('.suit-slots .slot').droppable({
        accept: '.card',
        hoverClass: 'effect-hover',
        tolerance: 'pointer',
        drop: function(event,ui){
            handleDropInSuitSlots(event,ui,$(this));
        }
    });

    $('.empty-slots .slot').droppable({
        accept: '.card',
        hoverClass: 'effect-hover',
        tolerance:  'pointer',
        drop: function(event,ui){
            handleDropInEmptySlots(event, ui, $(this));
        }
    });

    $('.columns .col').droppable({
        accept: '.card',
        hoverClass: 'effect-hover',
        tolerance: 'pointer',
        drop: function(event,ui){
            handleDropInColumns(event, ui, $(this));
        }
    });

    $('.columns .col .card').dblclick(function() {
        handleDoubleClick($(this));
    });
}

function startScreen() {
    $('#start-screen').show();
    $('#win-screen').hide();
    $('#overlay').hide();
    $('#game-screen').hide();
}

function startGame() {
    $('#start-screen').hide();
    $('#win-screen').hide();
    $('#overlay').hide();
    $('#game-screen').show();
    newDeck();
}

function endGame() {
    $('#overlay').show();
    $('#win-screen').show();
}

function newDeck() {
    // Erase all cards
    $('.card').remove();

    // Create cards
    let deck = [];
    $.each(SUITS, function(i, suit){
        for (let i=1; i<=13; i++) {
            let newCard = $('<div id="card'+ suit + i +'" class="card" data-suit="'+ suit +'" data-number="'+ i +'">'
                + '<img src="img/cards/'+ suit + '/' + i +'.svg">'
                + '</div>');
            deck.push(newCard);
        }
    });
    console.log(deck);

    // Fill columns with cards
    let column = 1, top = 0;
    $.each(shuffleArray(deck), function(index, card){
        card.css('position', 'relative');
        $('.col_' + column).append(
            card.animate({
                left: 0,
                top:  -(top) + 'px' }, (index * 500/52)
            )
        );
        if (column >= 8) {
            column = 0;
            top += 100;
        }
        column++
    });

    // Draggable option
    $('.card').draggable({
        revert: true,
        //start : handleDragStart,
        stop  : handleDragStop
    })
}

function handleDragStart(event, obj){

}

function handleDoubleClick(card){
    // Check if the card is the last child in the column
    if (card.is(':last-child') == false) {
        return;
    }

    // 1. Check if the can be stored in suit slots
    let suitSlot = $('.suit-slots .slot-' + card.data("suit"));
    // Check if the card is the ace
    if (card.data("number") == 1) {
        handleMoveCard(card, suitSlot);
        return;
    } else {
        // Check the last card stored
        if (suitSlot.length > 0) {
            let lastCard = suitSlot.find('.card:last-child').data('number');
            if (parseInt(card.data('number')) == (parseInt(lastCard)+1)) {
                handleMoveCard(card, suitSlot);
                return;
            }
        }
    }

    // 2. Check if there is an empty slot
    $('.empty-slots .slot').each(function() {
        if (!$(this).children('.card').length) {
            handleMoveCard(card, $(this));
            return;
        }
    });
}

function handleDragStop(event, obj){
    $('.columns .col').show().css('visibility', 'visible');
}

function handleMoveCard(card, target){
    // Update styles
    card.detach().appendTo(target).removeAttr('style');
    card.css('top', '0px');
    card.css('left', '0px');
    card.css('z-index', 200);
    card.css('cursor','default');
    card.draggable('option', 'revert', false);

    // If target is a suit slot - Lock the drag option
    if (target.parent().hasClass("suit-slots")) {
        card.css('position', 'absolute');
        card.draggable({
            start: function(event, obj){
                card.droppable('enable');
            },
        });
    }

    // If target is a column - Set the correct top and z-index
    if (target.parent().hasClass("columns")) {
        let top = 0;
        if (target.children().length > 0) {
            top = (target.children().length -1) * -100;
        }
        card.css({'z-index':'','top':top+'px'});
        card.draggable({
            start : function(event, obj){
                $(this).draggable('option', 'revert', true);
            }
        });
    }
    
    // Update movement count
    MOVS++;

    // Check if all cards are on suit slots 
    if ($('.suit-slots .card').length == 52){
        endGame();
    }
}

function handleDropInEmptySlots(event, obj, drop) {
    // Check if slot is empty
    if (drop.children('.card').length) {
        return false;
    }
    // Move Card
    handleMoveCard(obj.draggable, drop);
}

function handleDropInColumns(event, obj, drop) {
    let card = obj.draggable;

    // Get the last card
    let cardOnTop = drop.children().last();

    // If the column has cards
    if (drop.children().length > 0) {
        // Check the suit color
        if (SUIT_COLOR_ACCEPT[cardOnTop.data('suit') ].includes(card.data('suit')) == false ) {
            return false;
        }
        // Check number sequence
        if ((parseInt(card.data('number'))+1) != parseInt(cardOnTop.data('number'))) {
            return false;
        }
    } else {
        //Check if the card is the king
        //Only the king can starts a new column
        if (card.data('number') != 13) {
            return false;
        }
    }

    // Move the card
    handleMoveCard(card, drop);
}

function handleDropInSuitSlots(event, obj, drop) {
    // Check if is the ace
    if (drop.children('.card').length == 0 && obj.draggable.data('number') != '1' ) {
        return false;
    }
    // Check the suit type
    if (drop.hasClass("slot-" + obj.draggable.data("suit")) == false) {
        return false;
    }
    // Check if is a valid card
    if (drop.children('.card').length > 0) {
        let card = $(obj.draggable);
        let topCard = $(drop.children('.card').last());
    
        // Is card next in sequence?
        if (topCard.data('suit') != card.data('suit') || parseInt(card.data('number')) != (parseInt(topCard.data('number'))+1)) {
            return false;
        }
    }
    // Move Card
    handleMoveCard(obj.draggable, drop);
}

function shuffleArray(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
