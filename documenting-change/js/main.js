var $ = jQuery;
$('.tag').on('click', function(el) {
  var $el = $(this);
  var tagText = $el.text();
  toggleTagsActive(tagText);
  hideInactiveArticles();
});

function toggleTagsActive(text) {
  var allTags = $('.tag');
  allTags.each(function() {
    var $el = $(this);
    if ( $el.text() === text ) {
      $el.toggleClass('active');
    } else {
      $el.removeClass('active');
    }
  });
}

function hideInactiveArticles() {
  if ($('.tag').is('.active')) {
    showActiveArticles();
  } else {
    showAllArticles();
  }
}

function showActiveArticles() {
  $('.article').not(':has(.active)').addClass('hidden');
  $('.article:has(.active)').removeClass('hidden');
}

function showAllArticles() {
  $('.article').removeClass('hidden');
}
