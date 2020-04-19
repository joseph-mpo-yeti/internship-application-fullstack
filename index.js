addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

class HeaderRewriter {
  element(element) {
    element.replace(`<h1 style="font-size: 1.5rem;margin 15px;">Hello World!</h1>`, {
      html: true
    })
  }
}


class LinkRewriter {
  element(element){
    const className = element.getAttribute('class');
    const link = element.getAttribute('href');
    const newText = 
      `<a class="${className}" href="${link}" id="url">Visit cloudflare.com for more</a>`;
    element.replace( newText, {html: true})
  }
}

class ParagraphRewriter {
  element(element) {
    const className = element.getAttribute('class');
    const newText = `
      <p class="${className}">
        And I have more tricks in my hat.<br>
        <br>
        <span style="font-size: 24px;">&#129497;&#127997;</span>
        <a href="https://bit.ly/jmyresume" style="color: #795548;margin-left: 10px;" target="_blank">
          Here lies the answer you seek.
        </a>
      </p>`;
    element.after(newText, {
      html: true
    });
  }
}

// Modyfies the h1 header and the paragraph
const rewriter = new HTMLRewriter()
  .on('h1', new HeaderRewriter())
  .on('p', new ParagraphRewriter())
  .on('a#url', new LinkRewriter())


/**
 * Fetches the url, and modifies the body
 * from the response before returning it
 * @param {String} url 
 */
async function transform(url) {
  const res = await fetch(url)
  return rewriter.transform(res);
}

/**
 * Handles routing
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = "https://cfw-takehome.developers.workers.dev/api/variants";
  
  // Handling request for favicon
  if(request.url.indexOf('favicon') !== -1){
    return await fetch(url+"/favicon.co", request);
  }

  // Fetching variants
  const response = await fetch(url);
  const data = await response.json();
  const urls = data.variants;

  // Retrieving the variant that was not last visited
  const variant = getVariant(urls, request.headers.get('Cookie'))
  
  // Cookie expires in 7 days
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  
  return new Response((await transform(variant)).body, {
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': `lastUrlVisited=${variant};Expires=${expires.toGMTString()};`
      }
  });  
}

/**
 * Gets the url that was not last visited
 * @param {Array<String>} urls 
 * @param {String} cookieStr 
 */
function getVariant(urls, cookieStr){
  const regex = new RegExp(/lastUrlVisited\=.+/ig)
  if(cookieStr){
    const cookiesArray = cookieStr.match(regex);
    if(cookiesArray){
      const cookie = cookiesArray[0].split('=')[1]
      if(cookie === urls[0]){
        return urls[1]
      }

      return urls[0]
    }
  }

  // Picks a variant randomly
  return urls[Math.round(Math.random())]
}