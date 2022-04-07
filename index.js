const cheerio = require("cheerio");
const request = require("request");
const path = require("path");
const fs = require("fs");
const pdfkit = require("pdfkit");

// Get topics from  url
function getTopics() {
  let url = "https://github.com/topics";

  request(url, cb);
  // getting html from url
  function cb(err, res, html) {
    if (err) console.log(err);
    else if (res.StatusCode === 404) console.log("Page Not Found!");
    handlehtml(html);
  }

  const handlehtml = (html) => {
    const htmlSelector = cheerio.load(html);
    let topicsArray = htmlSelector(".no-underline.flex-1.d-flex.flex-column");
    let topicNameArray = htmlSelector(
      ".f3.lh-condensed.mb-0.mt-1.Link--primary"
    );
    // Getting and storing topics
    // Getting Link of all topics
    // Making directories of Topics
    for (let i = 0; i < 3; i++) {
      let topicLink = htmlSelector(topicsArray[i]).attr("href");
      let topicName = htmlSelector(topicNameArray[i + 3]).text();
      let topicPath = path.join(__dirname, "/Results", topicName);
      if (!fs.existsSync(topicPath))
        fs.mkdirSync(topicPath, { recursive: true });
      let fullTopicLink = url.replace("/topics", "") + topicLink;
      // Passing topic url and local directorie path till topics
      getRepos(fullTopicLink, topicPath);
    }
  };
}

// Getting Repos from topic url
function getRepos(topicLink, topicPath) {
  request(topicLink, cb);
  //Getting html from url
  function cb(err, res, html) {
    if (err) console.log(err);
    else if (res.StatusCode === 404) console.log("Page Not Found!");
    handlehtml(html);
  }
  // Getting Repos names and Links
  // Making issues url to navigate to issues
  const handlehtml = (html) => {
    const htmlSelector = cheerio.load(html);
    const reposArray = htmlSelector(".text-bold.wb-break-word");
    for (let i = 0; i < 10; i++) {
      let repoLink = htmlSelector(reposArray[i]).attr("href");
      let repoName = htmlSelector(reposArray[i])
        .text()
        .replaceAll(" ", "")
        .replaceAll("\n", "");
      let issueUrl = "https://github.com" + repoLink + "/issues";
      // Passing issue url, repo Name and topic Directory path
      getIssues(issueUrl, repoName, topicPath);
    }
  };
}

// Getting issues with issue url and topic
// Making repo Name pdf file at topic directory
function getIssues(issueUrl, repoName, topicPath) {
  let repoPdf = topicPath + "/" + repoName + ".pdf";

  request(issueUrl, cb);
  // Getting html from issues page
  function cb(err, res, html) {
    if (err) console.log(err);
    else if (res.StatusCode === 404) console.log("Page Not Found!");
    handlehtml(html);
  }
  // Getting issues name and links
  // Writing in pdf
  const handlehtml = (html) => {
    let finalData = [];
    // Getting issues list
    const htmlSelector = cheerio.load(html);
    const issuesArray = htmlSelector(
      ".Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title"
    );
    // Filtering data
    for (let i = 0; i < issuesArray.length; i++) {
      finalData.push(htmlSelector(issuesArray[i]).text());
      finalData.push(
        "https://github.com" + htmlSelector(issuesArray[i]).attr("href")
      );
    }
    // Edit pdfs
    const doc = new pdfkit();
    doc.pipe(fs.createWriteStream(repoPdf));
    let count = 1;

    doc.fontSize(50).text(repoName);
    // Stringify lines and add data to pdf
    for (let i = 0; i < finalData.length; i++) {
      let issueLine = JSON.stringify(finalData[i]);
      if (i % 2 === 0) {
        data = count + ". " + issueLine;
        doc.fontSize(15).text(data).fillColor("blue");
        count++;
      } else {
        doc
          .fontSize(15)
          .text(issueLine, { underline: true })
          .fillColor("black");
      }
    }
    doc.end();
  };
}

getTopics();
