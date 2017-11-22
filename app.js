var express = require('express');
var Session = require('express-session');
var google = require('googleapis'); //https://github.com/google/google-api-nodejs-client
var plus = google.plus('v1'); //https://developers.google.com/apis-explorer/#search/plus/
var app = express();
var port = 1234;

var OAuth2 = google.auth.OAuth2;
var ClientId = "1094433847792-f2jfl100iu2euppjlno20jrfvttjh4eh.apps.googleusercontent.com";
var ClientSecret = "_y-RGdpMUWOF5cnbt-CgfKU4";
var RedirectUrl = "http://localhost:1234/oauthCallback/";

app.use(Session({
    secret: 'raysources-secret-19890913007',
    resave: true,
    saveUninitialized: true
}));

/**
 * 创建OAuth客户端
 */
function getOAuthClient() {
    return new OAuth2(ClientId, ClientSecret, RedirectUrl);
}
/**
 * 生成向认证服务器申请认证的Url
 */
function getAuthurl() {
    var oauth2Client = getOAuthClient();
    // 生成一个url用来申请Googe+和Google日历的访问权限
    var scopes = [
        'https://www.googleapis.com/auth/plus.me'
        // 'https://www.googleapis.com/auth/calendar'
    ];
    var url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        // If you only need one scope you can pass it as a string
        scope: scopes,
        // Optional property that passes state parameters to redirect URI
        state: { foo: 'bar' }
    });
    return url;
}
app.get("/", function(req, res) {
    var url = getAuthurl();
    res.send(`<h1>Authentication using google oAuth</h1><a href=${url}>Login</a>`);
});
// GET /oauthcallback?code={authorizationCode}
app.get("/oauthCallback", function(req, res) {
    // 获取url中code的值
    var code = req.query.code;
    var session = req.session;
    // 使用授权码code，向认证服务器申请令牌
    var oauth2Client = getOAuthClient();
    oauth2Client.getToken(code, function(err, tokens) {
        // tokens包含一个access_token和一个可选的refresh_token
        if (!err) {
            oauth2Client.setCredentials(tokens);
            session["tokens"] = tokens;
            res.send(`<h3>Login successful!</h3><a href="/details">Go to details page</a>`)
        } else {
            res.send(`<h3>Login failed!!</h3>`)
        }
    });
});
app.get("/details", function(req, res) {
    var oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(req.session["tokens"]);

    new Promise(function(resolve, reject) {
        // https://developers.google.com/+/web/api/rest/latest/people/get
        // me 表示通过授权的用户
        plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
            if (!err) {
                resolve(response)
            } else {
                reject(err)
            }
        });
    }).then(function(data) {
        res.send(`<img src=${data.image.url} /><h3>Id ${data.id}</h3><h3>Hello ${data.displayName}</h3><h3>profile url ${data.url}</h3>`);
    }).catch(function(err) {
        res.send(`message get failed!`)
    })
});

app.listen(port);