var KEY = '0AmqohgGX3YQadE1VSktrWG1nNFF6RUFNT1RKa0k0a2c',
    ALL_DATA;

function urlify(text) {
    //Replace any URL in text with a link
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function(url) {
                    return '<a href="' + url + '">' + url + '</a>';
        })
}


function init() {

    Handlebars.registerHelper('linkify', function(moreinfo) {
        return new Handlebars.SafeString(urlify(moreinfo));
    });

    Handlebars.registerHelper('formatDate', function(dateString) {
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
            dateSplit = dateString.split("/"),
            monthNumber = dateSplit[0]-1,
            day = dateSplit[1],
            year = dateSplit[2],
            cleanDate = monthNames[monthNumber] + " " + day + ", " + year;

        return new Handlebars.SafeString(cleanDate);
    });

    Tabletop.init({key: KEY,
                   callback: processData,
                   simpleSheet: true, 
                   wanted: ['Listings'],
                   orderby: 'dateentered',
                   reverse: true
        } 
    );
}

function processData(data, tabletop) {
    ALL_DATA = data;
    var source = $('#jobs').html(),
        template = Handlebars.compile(source);
    $('#loading').hide();
    $('#jobs-list').append(template({"jobs":ALL_DATA}));
}

function IsURL(url) {

    var strRegex = "^((https|http|ftp|rtsp|mms)?://)"
        + "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp的user@
        + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184
        + "|" // 允许IP和DOMAIN（域名）
        + "([0-9a-z_!~*'()-]+\.)*" // 域名- www.
        + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名
        + "[a-z]{2,6})" // first level domain- .com or .museum
        + "(:[0-9]{1,4})?" // 端口- :80
        + "((/?)|" // a slash isn't required if there is no file name
        + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
     var re=new RegExp(strRegex);
     return re.test(url);
 }

function isUrl(s) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)? (\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
}

