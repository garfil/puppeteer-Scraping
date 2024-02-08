// src/capture.js
const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
// this module will be provided by the layer
// const chromeLambda = require("chrome-aws-lambda");

app.post('/scrape', async (req, res) => {
    const url = req.query.url; // get the URL to scrape from the request query parameters
    const result  = await handler(url)
    res.send(result); 
  });


const handler = async (event) => {
console.log("eventt====", event)
    // launch a headless browser
    const browser = await puppeteer.launch({
        args: [
        // ...chromeLambda.args,
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-gpu',
        '--disable-software-rasterize',
        '--incognito',
        ],
        // defaultViewport: chromeLambda.defaultViewport,
        // executablePath: await chromeLambda.executablePath,
        headless: true,
        // chromium.headless,
        dumpio: true
    });

    // let allHTML = []


    // console.log("array of links type", typeof event.searchLinks);
    // console.log("array of links =====> ", event.searchLinks);
    // for (var i = 0; i < event.searchLinks.length; i++) {
    //     console.log("puppeteer begins1 ", event.searchLinks[i]);
    //     allHTML.push(goToPage(event.searchLinks[i], browser))
    // }
    // let h = await Promise.all(allHTML)
    // allHTML.push(goToPage(event, browser))
    let h = await goToPage(event, browser)
    console.log("value of HHHHHHHH ===", h?.length);

    // let pages = await browser.pages();
    // await Promise.all(pages.map(page => page.close()));
    await browser.close();
    return {
        statusCode: 200,
        body: JSON.stringify({
            h,
        }),
    };
    // return {
    //     statusCode: 200,
    //     body: {
    //         h,
    //     },
    // };


    //   =========================== Open a page and navigate to the url (working code)
    //   const page = await browser.newPage();
    //   await page.goto("https://www.educative.io/edpresso/puppeteer-on-aws-lambda");
    //   const pageHTML = await page.evaluate('new XMLSerializer().serializeToString(document.doctype) + document.documentElement.outerHTML');
    //   console.log("puppeteer begins2 ", pageHTML);
    //   return { url: pageHTML };
    //   ============================
};

async function goToPage(url, browser) {
    return new Promise(async (resolve, reject) => {
        try {
             const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(0)
            console.log("linkkk", url)
            // await page.setUserAgent('Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Scalenutbot/2.1; +http://www.scalenut.com/bot.html)');
            // await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36')
            await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // await page.setRequestInterception(true);
        
            // //if the page makes a  request to a resource type of image or stylesheet then abort that            request
            // page.on('request', request => {
            //     if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet')
            //         request.abort();
            //     else
            //         request.continue();
            // });
        
            const response = await page.goto(url, {
                waitUntil: 'domcontentloaded',
            });
            const statusCode = response.status()
            console.log("statusCode", statusCode)
            if(statusCode != 200){
                // await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36')
                 await page.goto(url, {
                    waitUntil: 'domcontentloaded',
                });
            }
            // Wait for an additional 5 seconds(milliseconds * 1000)
            await page.waitForTimeout(5000);
            
            console.log("after go to page")
            // const pageHTML = await page.evaluate('new XMLSerializer().serializeToString(document.doctype) + document.documentElement.outerHTML');
            
            
            // let bodyHandle = await page.$("body");
            // let pageHTML = await page.evaluate(
            // (body) => body.outerHTML,
            // bodyHandle
            // );
            let { pageHeadHTML, pageHTML } = await page.evaluate(() => {
                const head = document.querySelector('head');
                const body = document.querySelector('body');
                return {
                    pageHeadHTML: head.outerHTML,
                    pageHTML: body.outerHTML,
                };
              });
            if (!pageHTML) {
              // Wait until network activity is low for at least 500ms
              await page.goto(url, { waitUntil: 'networkidle0' });
              let pHTML =await page.evaluate(() => {
                const head = document.querySelector('head');
                const body = document.querySelector('body');
                return {
                    pageHeadHTML: head.outerHTML,
                    pageHTML: body.outerHTML,
                };
              });
              pageHTML = pHTML.pageHTML;
              pageHeadHTML = pHTML.pageHeadHTML;
            } 
            // let headHandle = await page.$("head");
            // let pageHeadHTML = await page.evaluate(
            //     (head) => head.outerHTML,
            //     headHandle
            //     );
        // console.log("puppeteer body ", pageHTML);
            
            if(pageHTML.includes('<div id="__next"') || pageHTML.includes('<div data-react') ||  pageHTML.includes('<div data-reactroot="')){
                if(pageHTML.includes('<div id="__next"></div><script')){
                    await page.evaluate(async () => { 
                        await new Promise((resolve, reject) => {
                        let totalHeight = 0;
                        const distance = 500;
                        const maxScrollHeight = 100;
                        const timer = setInterval(() => {
                            const scrollHeight = document.body.scrollHeight;
                            window.scrollBy(0, distance);
                            totalHeight += distance;
                            if (totalHeight >= scrollHeight || totalHeight >= maxScrollHeight) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 300);
                        });
                    });
                    let bodyHandle = await page.$("body");
                    pageHTML = await page.evaluate(
                        (body) => body.outerHTML,
                        bodyHandle
                        );
                    let headHandle = await page.$("head");
                    pageHeadHTML = await page.evaluate(
                        (head) => head.outerHTML,
                        headHandle
                        );
                    console.log("puppeteer begins2 ", pageHeadHTML + pageHTML);
                }
                
            }
            console.log("puppeteer begins2 ", pageHeadHTML + pageHTML);
            resolve(pageHeadHTML + pageHTML)

        } catch (error) {
            console.log("error=====", error)
            resolve()
        }

    })
}



app.listen(3000, () => {
    console.log('Server started on port 3000');
  });