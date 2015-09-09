$('.cover').on('click', function(e) {
    var xPos = e.pageX;
    var left = (xPos < window.innerWidth/2 );
    console.log('left half ', left);
    var $li = $(this).parent();
    $li.toggleClass('focused');
    $li.siblings('.focused').removeClass('focused');

    console.log('cover clicked');
});
