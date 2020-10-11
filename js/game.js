// Constants

let SUITS = ['hearts', 'spades', 'diamonds', 'clubs'];
let SUIT_COLOR_ACCEPT = {
    'hearts' : ['clubs', 'spades'],
    'spades' : ['diamonds', 'hearts'],
    'diamonds' : ['clubs', 'spades'],
    'clubs' : ['diamonds', 'hearts'],
};
let CARDS_ORDER = {
    a: { dropOn:''  , dropAccept:'2' },
    2: { dropOn:'a' , dropAccept:'3' },
    3: { dropOn:'2' , dropAccept:'4' },
    4: { dropOn:'3' , dropAccept:'5' },
    5: { dropOn:'4' , dropAccept:'6' },
    6: { dropOn:'5' , dropAccept:'7' },
    7: { dropOn:'6' , dropAccept:'8' },
    8: { dropOn:'7' , dropAccept:'9' },
    9: { dropOn:'8' , dropAccept:'10'},
    10:{ dropOn:'9' , dropAccept:'j' },
    j: { dropOn:'10', dropAccept:'q' },
    q: { dropOn:'j' , dropAccept:'k' },
    k: { dropOn:'q' , dropAccept:''  }
};
let MOVS = 0;
let TIME = 0;
let MARGIN_CARDS = 40;

function gameInit() {
    gameReset();

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
}

function gameReset() {
    $('#start-screen').hide();
    $('#winner-screen').hide();
    $('#overlay').hide();
    $('#game-screen').show();

    newDeck();
}

function newDeck() {
    let deck = [];

    // Erase all cards
    $('.card').remove();

    // Create cards
    $.each(SUITS, function(i, suit){
        $.each(CARDS, function(j, card){
            let newCard = $('<div id="card'+ suit + card +'" class="card" data-suit="'+suit+'" data-number="'+card+'">'
                + '  <img class="card-'+card+' '+suit+'" src="assets/img/cards/'+suit+'/'+card+'.svg">'
                + '</div>');
                deck.push(newCard);
        });
    });

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
        start : handleDragStart,
        stop  : handleDragStop
    })
}

function handleDragStart(event, obj){

}

function handleDragStop(event, obj){
    $('.columns .col').show().css('visibility', 'visible');
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

function gameWin() {
    $('#overlay').show();
    $('#winner-screen').show();
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
    //Check if is the ace
    if (drop.children('.card').length == 0 && obj.draggable.data('number') != 'a' ) {
        return false;
    }

    // Check the type of suit
    if (drop.hasClass("slot-" + obj.draggable.data("suit")) == false) {
        return false;
    }

    // Check if is a valid card
    if (drop.children('.card').length > 0) {
        let card = $(obj.draggable);
        let topCard = $(drop.children('.card').last());
    
        // Is card next in sequence?
        if ( topCard.data('suit') != card.data('suit') || CARDS_ORDER[topCard.data('number')].dropAccept != card.data('number') ) {
            //if ( gGameOpts.showTips ) null; // TODO
            return false;
        }
    }

    // Change cards properties to keep them on suit slots
    obj.draggable.detach().appendTo($(drop)).removeAttr('style');
    obj.draggable.draggable('option', 'revert', false);
    obj.draggable.css({ position:'absolute', top:'0px', left:'0px' });
    obj.draggable.css('z-index', $(drop).find('.card').length); // set index to prevent 
    obj.draggable.draggable('disable');
    obj.draggable.css('cursor','default');

    //Update movement count
    MOVS++;

    // Check if all cards are on suit slots 
    if ($('.suit-slots .card').length == 52){
        gameWin();
    }
}

// ==============================================================================================
$(document).ready(function(){
    $("#btnStartGame").on("click", gameInit);
    $("#btnRestartGame").on("click", gameReset);
})