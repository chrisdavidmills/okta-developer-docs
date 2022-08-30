const fs = require('fs');
const path = require('path')

function getNavbarConstPages() {
  const file = path.resolve(__dirname, '../../../vuepress-theme-prose/const/navbar.const.js'); // Main document file
  let content = fs.readFileSync(file, {encoding:'utf8'});
  let splitted = content.split(';');
  let navbarItems = [];
  for (let i = 0; i < splitted.length; i++) {
    let cleared = splitted[i]
      .replace('export const concepts = ', '')
      .replace('export const guides = ', '')
      .replace('export const languagesSdk = ', '')
      .replace('export const reference = ', '')
      .replace('export const releaseNotes = ', '');
      if (cleared !== '') {
        let evaled = eval(cleared);
        if (evaled) {
          navbarItems.push(evaled[0]);
        }
      }
  }
  return navbarItems;
}

function sanitizeTitle(el) {
  if (el.guideName) {
    return el.guideName;
  }
  return el.title.toLowerCase().replace(/ /ig, '-').replace(/\//ig, '-');
}

let generatedPages = [];

function generatedLinks(arr, parent = null) {
  if (arr) {
    for (let el of arr) {
      if (el) {
        if (!el.path && !el.guideName) {
          const parentTitle = sanitizeTitle(parent)
          let path = ''
          if (parentTitle !== 'guides' && parent.path.indexOf(parentTitle) >= 0) {
            path = parent.path.replace(parentTitle, sanitizeTitle(el))
          } else if (parent.path == '/docs/guides/oin-lifecycle-mgmt-overview/') {
            path = '/docs/guides/' + sanitizeTitle(el) + "/"
          } else {
            path = parent.path + sanitizeTitle(el) + "/"
          }
          const page = {
            path,
            title: el.title,
            frontmatter: {}
          }
          if (el.customLandingPage) {
            page.frontmatter.customLandingPage = true
          } else {
            page.frontmatter.generated = true
          }
          if (el.description) {
            page.description = el.description;
          }
          // if (el.customLandingPage) {
          //   function generateOINLinks(array) {
          //     if (array) {
          //       for (let el of array) {
          //         if (!el.path && el.subLinks) {
          //           path = '/docs/guides/' + sanitizeTitle(el) + "/"
          //           console.log(path)
          //         }
          //         if (el.subLinks) {
          //           if (el.path) {
          //             let splitted = el.path.split('/')
          //             el.path = '/' + splitted.filter((el, idx, arr)=>idx===1||idx===2||idx===arr.length-2).join('/') + '/';
          //             console.log(el.path)
          //           }
          //           generateOINLinks(el.subLinks);
          //         }
          //       }
          //     }
          //   }
          //   generateOINLinks(el.subLinks);
          // }
          generatedPages.push(page);
          el.path = path;
        }
        if (!el.path) {
          el.path = parent.path + sanitizeTitle(el) + "/";
        }
        if (el.subLinks && el.subLinks.length > 0) {
          generatedLinks(el.subLinks, el);
        }
      }
    }
  }
}
generatedLinks(getNavbarConstPages());

const overviewPages = () => {
  return generatedPages;
}

module.exports = overviewPages;
