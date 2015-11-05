var VERBOSE = true;

class Domain {
  constructor(options){
    this.domain = options.domain;
    this.template = null;
    this.productivity = options.productivity == undefined ? options.productivity : 0;
    this.visits = options.visits;
    this.history = {};
  }

  render(){
    var compiled = _.template(this.template);
    return compiled(this.toObject());
  }

  toObject(){
    var obj = {};
    obj.domain = this.domain;
    obj.productivity = this.productivity;
    return obj;
  }

  setTemplate(template){
    if(typeof template == "object"){ template = template.join("\n"); }
    this.template = template;
  }

  setHistory(historyObject){
  }

  isProductive(val){
    /* 0: UNKNOWN | 1: UNPRODUCTIVE | 2: PRODUCTIVE */
    if(val != undefined){ this.isProductive = val; }
    return this.isProductive;
  }
}


/**** TEST DUMMY DATA ****/
var exampleDomains = [
  {
    domain: "domain.com",
    visits: 58,
    lastSevenDays: null,
    productivity: 2,
  },
  {
    domain: "bomb.com",
    visits: 68,
    lastSevenDays: null,
    productivity: 1,
  },
  {
    domain: "wombo.com",
    visits: 20,
    lastSevenDays: null,
    productivity: 1
  },
  {
    domain: "everybodywombo.com",
    visits: 90,
    lastSevenDays: null,
    productivity: 0
  },
];

var domains = [];
for(var item of exampleDomains){
  var d = new Domain(item);
  domains.push(d);
}

/**** END TEST DUMMY DATA ****/


var renderGraph = function() {
  if(VERBOSE){ console.debug("FUNCTION CALL: renderGraph()"); }

  var xScale = new Plottable.Scales.Linear();
  var yScale = new Plottable.Scales.Linear();

  var xAxis = new Plottable.Axes.Numeric(xScale, "bottom");
  var yAxis = new Plottable.Axes.Numeric(yScale, "left");

  var plot = new Plottable.Plots.Line();
  plot.x(function(d) { return d.x; }, xScale);
  plot.y(function(d) { return d.y; }, yScale);

  var data = [
    { "x": 0, "y": 1 },
    { "x": 1, "y": 2 },
    { "x": 2, "y": 4 },
    { "x": 3, "y": 8 }
  ];

  var dataset = new Plottable.Dataset(data);
  plot.addDataset(dataset);

  var chart = new Plottable.Components.Table([
    [yAxis, plot],
    [null, xAxis]
  ]);

  chart.renderTo("svg#graph");
}

//=============================================================
//Begin history parsing code


// Search history to find up to ten links that a user has typed in,
// and show those links in a popup.
function buildTypedUrlList() {
  // To look for history items visited in the last week,
  // subtract a week of microseconds from the current time.
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;

  // Track the number of callbacks from chrome.history.getVisits()
  // that we expect to get.  When it reaches zero, we have all results.
  var numRequestsOutstanding = 0;

  chrome.history.search({
      'text': '',              // Return every history item....
      'startTime': oneWeekAgo  // that was accessed less than one week ago.
  },
  function(historyItems) {
      // For each history item, get details on all visits.
      for (var i = 0; i < historyItems.length; ++i) {
        var url = historyItems[i].url;
        var processVisitsWithUrl = function(url) {
          // We need the url of the visited item to process the visit.
          // Use a closure to bind the url into the callback's args.
          return function(visitItems) {
            processVisits(url, visitItems);
          };
        };
        chrome.history.getVisits({url: url}, processVisitsWithUrl(url));
        numRequestsOutstanding++;
      }
      if (!numRequestsOutstanding) {
        onAllVisitsProcessed();
      }
    });

  // Maps URLs to a count of the number of times the user typed that URL into
  // the omnibox.
  var urlToCount = {};

  // Callback for chrome.history.getVisits().  Counts the number of
  // times a user visited a URL by typing the address.
  var processVisits = function(url, visitItems) {
    for (var i = 0, ie = visitItems.length; i < ie; ++i) {
      // Ignore items unless the user typed the URL.

      if (!urlToCount[url]) {
        urlToCount[url] = 0;
      }

      urlToCount[url]++;
    }

    // If this is the final outstanding call to processVisits(),
    // then we have the final results.  Use them to build the list
    // of URLs to show in the popup.
    if (!--numRequestsOutstanding) {
      onAllVisitsProcessed();
    }
  };

  // This function is called when we have the final list of URls to display.
  var onAllVisitsProcessed = function() {
    // Get the top scorring urls.
    var urlArray = [];
    for (var url in urlToCount) {
      urlArray.push(url);
    }

    // Sort the URLs by the number of times the user typed them.
    urlArray.sort(function(a, b) {
      return urlToCount[b] - urlToCount[a];
    });

    console.log(urlArray.slice(0, 10));
  };
}

//End History pasing code
//======================================================================================


handleData()

fetchWikipediaArticle.handleData()


var fetchWikipediaArticle = function(titleName){

  var wikiArticleLink = "http://en.wikipedia.org/wiki/" + titleName;


  var container = $(".wikipedia-container");
  var templateString = wikipediaArticleTemplate.join("\n");
  var compiled = _.template(templateString);

  var handleData = function(data){

    var truncatedSummary = "not found";
    var imageUrl = "images/notfound.png";
    var title = "Article Could Not Be Fetched";

    if(data.summary != undefined){
      if(data.summary.title != undefined){
        title = data.summary.title;
      }

      if(data.summary.image != undefined){
        imageUrl = data.summary.image;
      }

      if(data.summary.summary != undefined){
        truncatedSummary = data.summary.summary.substring(0,150) + "...";
      }
    }

    var rendered = compiled({
      title: title,
      imageUrl: imageUrl,
      summary: truncatedSummary
    });

    container.append(rendered);
  }

  WIKIPEDIA.getData(wikiArticleLink, handleData);

  /****
  var wikiArticleLink = "http://en.wikipedia.org/wiki/Invasion_of_Normandy";
  var handleData = function(data){

    console.log(data.summary);
    console.log(data.summary.title);

    $("#title").html($("#title").html() + "" + data.summary.title);

    console.log(data.summary.summary);
    $("#summary").html($("#summary").html() + "" + data.summary.summary.substring(0,150) + "...");

    console.log(data.summary.image);
    //$("#image").html($("#image").html() + "" + data.summary.image);
    $("#put-image-here").attr("src", imageLink(data));
    $("#image-link").attr("href", wikiArticleLink);
  }

  function imageLink(data){
    return data.summary.image;
  }

  var handleError = function handleError(error){
    console.log(error);
  }

  */
}

var renderDomainList = function(domains, renderTargetSelector){
  if(VERBOSE){ console.debug("FUNCTION: renderDomainList()", domains, renderTargetSelector); }

  //Somewhere in here throws the error
  /*Uncaught EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' 
    is not an allowed source of script in the following Content Security Policy directive:
    "script-src 'self' blob: filesystem: chrome-extension-resource:".*/

  var str = "";
  for(var d of domains){
    d.setTemplate(domainListingTemplate);
    str += d.render();
  }

  for(var n of $(renderTargetSelector)){
    n.innerHTML = str;
  }
}

var DOMLoaded = function() {
  if(VERBOSE){ console.debug("EVENT: DOMContentLoaded"); }
  renderGraph();
  
  //Print out the lists of productive, unproductive, and undefinied domains to the console
  console.log(getDomains());
  
  renderDomainList(domains, "ul.domain-list-productive");
  var articles = ["Invasion_of_Normandy", "Banana", "Arthur_Tedder,_1st_Baron_Tedder"];
  for(var a of articles){
    fetchWikipediaArticle(a);
  }
}

document.addEventListener('DOMContentLoaded', DOMLoaded, false);
