var jade = require('jade');

var renderPage = function(res, page, context, headers, is_ssl){
    //TODO: add menu stuff
    if (!page)
    {
        throw new Error('you must specify a page to render.');
    }
    context = context || {}
    headers = headers || {}
    is_ssl = is_ssl || false
    
    var default_context = function (){
        return {
            player: false,
            system: {
                title: 'Demo System',
                name: 'Demo System',
                copyright: '&copy; Gregory McWhirter 2010',
                description: '',
                keywords: '',
                default_avatar: '/images/djo_avatar.jpg',
                is_ssl: is_ssl,
                analytics: ''
            },
            menu_content: {
                left: '',
                right: ''
            },
            body_content: ''
        };
    };
    
    context.default = default_context();
    context.default.menu_content.right = jade.render('img(src="/images/ad_placeholder.jpg", alt="Advertisement")',{locals: context.default});
    
    jade.renderFile(__dirname+"/../templates/"+page, {cache: true, filename: page, locals: context}, function(err,html){
        if(err)
        {
            res.writeHead(500, {'Content-type': 'text/plain'});
            res.end("Something broke rendering the page: "+err, "utf8");
        }
        else
        {
            var context = default_context();
            context.body_content = html;
            context.menu_content.right = jade.render('img(src="/images/ad_placeholder.jpg", alt="Advertisement")',{locals: context});
            jade.renderFile(__dirname+"/../templates/layout.jade", {cache: true, filename: "layout.jade", locals: context}, 
                function(err, html){
                    if(err)
                    {
                        res.writeHead(500, {'Content-type': 'text/plain'});
                        res.end("Something broke rendering the full page: " + err, "utf8");
                    }
                    else
                    {
                        headers['Content-type'] = headers['Content-type'] || 'text/html';
                        res.writeHead(200, headers);
                        res.end(html, 'utf8');
                    }
            });
        }
    });
};

var renderHeaders = function (res, code, headers){
    res.writeHead(code,headers);
}

var renderText = function (res, text, done, encoding){
    encoding = encoding || 'utf8';
    done = done || false;
    res.write(text, encoding);
    if (done)
    {
        res.end();
    }
}

var permRedirect = function (res, location){
    var body, headers;
    headers = {
        'Location': location
    }
    res.writeHead(301, headers);
    body = '<html><head><title>Page Moved</title></head><body><p>';
    body = body + 'The page you requested has permanently moved: <a href="'+location+'">'+location+'</a>.';
    body = body + '</p></body></html>';
    res.end(body, 'utf8');
}

var tempRedirect = function (res, location){
    var body, headers;
    headers = {
        'Location': location
    }
    res.writeHead(302, headers);
    body = '<html><head><title>Page Moved</title></head><body><p>';
    body = body + 'The page you requested has temporarily moved: <a href="'+location+'">'+location+'</a>.';
    body = body + '</p></body></html>';
    res.end(body, 'utf8');
}

var pageNotFound = function (res){
    res.writeHead(404);
    res.end('');
}

module.exports = {
    renderPage: renderPage,
    renderText: renderText,
    renderHeaders: renderHeaders,
    permRedirect: permRedirect,
    tempRedirect: tempRedirect,
    pageNotFound: pageNotFound
}
