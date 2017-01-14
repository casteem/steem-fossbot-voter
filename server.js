'use strict';

const
  lib = require("./lib.js"),
  express = require("express"),
  path = require("path"),
  bodyParser = require("body-parser"),
  fs = require('fs');

var html_algo_emptyList = "<tr><td>None</td><td></td><td>-</td><td>-</td><th><p><a class=\"btn btn-default\" href=\"#\" role=\"button\"><strike>Delete<strike></a></p></th></tr>";

var
  html_editAlgo1 = "",
  html_editAlgo2 = "";

var app = express();
app.set('port', process.env.PORT || 5000);
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Start server
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  lib.initSteem();
  if (!lib.hasFatalError()) {
    console.log("Dashboard min requirements met, will be active on HTTPS");
    lib.sendEmail("Voter bot", "Server status: started");
    loadFiles();
  } else {
    // kill node server to stop dashboard from showing and let owner know there is a problem without
    // giving any information away
    process.exit();
  }
});

module.exports = app;

// Utils
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason + ", MESSAGE: "+message);
  res.status(code || 500).json({"error": message});
}

function loadFiles() {
  loadFileToString("/html/edit-algo-part-1.html", function(str) {
    html_editAlgo1 = str;
    console.log("got /html/edit-algo-part-1.html from file");
  });
  loadFileToString("/html/edit-algo-part-2.html", function(str) {
    html_editAlgo2 = str;
    console.log("got /html/edit-algo-part-2.html from file");
  });
}

function loadFileToString(filename, callback) {
  fs.readFile(path.join(__dirname, filename), {encoding: 'utf-8'}, function(err,data) {
    var str = "";
    if (err) {
      console.log(err);
    } else {
      str = data;
    }
    if (callback) {
      callback(str);
    }
  });
}

// public HTTPS interface

/*
 * /run-bot endpoint
 *
 * Starts an iteration of the bot mainLoop
 *
 * Example usage:
 * /run-bot?API_KEY=1234
 */
app.get("/run-bot", function(req, res) {
  if (!req.query.api_key) {
    handleError(res, "/run-bot Unauthorized", "Run bot: api_key not supplied", 401);
    return;
  } else if (req.query.api_key.localeCompare(process.env.BOT_API_KEY)) {
    handleError(res, "/run-bot Unauthorized", "Run bot: api_key invalid", 401);
    return;
  }
  lib.runBot(function(obj) {
    console.log("lib.runBot returned: " + JSON.stringify(obj));
    if (obj) {
      res.status(obj.status).json(obj);
    } else {
      handleError(res, "/run-bot Internal error", "Run bot: Bot run failed internally, consult logs", 500);
    }
  });
});

// GET /edit-algo
app.get("/edit-algo", function(req, res) {
  getPersistentJson("algorithm", function(algorithmResult) {
    var algorithm = {};
    if (algorithmResult != null) {
      algorithm = algorithmResult;
      console.log(" - got algorithm from redis store: "+JSON.stringify(algorithm));
    } else {
      console.log(" - no algorithm in redis store, USING DEFAULT");
      // TODO : remove this default algorithm setting
      algorithm = {
        weights: [
          {key: "post_num_links_video", value: -10},
          {key: "post_num_words", value: 0.5, lower: 500, upper: 2000},
          {key: "author_is_followed", value: 50},
          {key: "post_voted_any_whale", value: 20},
          {key: "post_voted_num_dolphin", value: 5},
          {key: "author_repuation", value: 10, lower: 25, upper: 75},
          {key: "post_num_votes", value: -2}
        ],
        authorWhitelist: [],
        authorBlacklist: [],
        contentCategoryWhitelist: [],
        contentCategoryBlacklist: [],
        contentWordWhitelist: [],
        contentWordBlacklist: [],
        domainWhitelist: [],
        domainBlacklist: []
      };
    }
    var html_list = "";
    if (algorithm.weights.length > 0) {
      for (var i = 0 ; i < algorithm.weights.length ; i++) {
        html_list += "<tr><td>"+algorithm.weights[i].key+"</td><td>"+algorithm.weights[i].value+"</td>";
        if (algorithm.weights[i].hasOwnProperty("lower")) {
          html_list += "<td>"+algorithm.weights[i].lower+"</td>";
        } else {
          html_list += "<td>-</td>";
        }
        if (algorithm.weights[i].hasOwnProperty("upper")) {
          html_list += "<td>"+algorithm.weights[i].upper+"</td>";
        } else {
          html_list += "<td>-</td>";
        }
        // TODO : add href url delete to button
        html_list += "<th><p><a class=\"btn btn-default\" href=\"#\" role=\"button\"><strike>Delete<strike></a></p></th>";
        html_list += "</tr>";
      }
    } else {
      html_list = html_algo_emptyList;
    }
    // TODO : make list
    res.send(200, 
      html_editAlgo1 
      + html_list
      + html_editAlgo2);
    });
});