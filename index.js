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
 * Respond with the modified body of the response
 * fetched from of ttwo variants
 * @param {Request} request
 */
async function handleRequest(request) {
  // fecthing the variants from API
  const response = await fetch("https://cfw-takehome.developers.workers.dev/api/variants");
  const data = await response.json();
  
  // Getting the last url visited from Cookies
  const variant = getVariant(data.variants, request.headers.get('Cookie'))
  
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  
  let res = await rewriter.transform(await fetch(variant));
  res = new Response(res.body, {
    headers: {
      'Content-Type': 'text/html', 
      'Set-Cookie':`lastUrlVisited=${variant};Expires=${expires.toGMTString()};`
    }
  })

  return res
}

/**
 * Retrieves the variant not visited from the cookie
 * @param {Array} urls variants
 * @param {String} cookie string retrieved for cookies
 * @returns a string URL to be redirected to
 */
function getVariant(urls, cookie){
  if(cookie){
    const cookieRegex = new RegExp(/lastUrlVisited\=(.+)/ig);
    const cookies = cookie.match(cookieRegex);
    
    if(cookies){
      const url = getUrlFromCookie(cookies[0])
      console.log(url);
      console.log(url === urls[0]);
      if(url === urls[0]){
        return urls[1]
      }
    }
  }

  return urls[0]
}

/**
 * Retrieves the url from a cookie
 * @param {String} cookie 
 * @returns a string URL
 */
function getUrlFromCookie(cookie){
  return cookie.split('=')[1]
}