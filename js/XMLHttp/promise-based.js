import Promise from 'promise-polyfill';

class XMLHttp {

 constructor() {
  if (!!XMLHttp.instance) {
   return XMLHttp.instance;
  }
  XMLHttp.instance = this;
  return this;
 }

 ajaxCall(config) {
  config = Object.entries(Object.assign({}, config));
  let uri = ""
  config.forEach(item => {
   uri += item[0] + "=" + item[1] + "&";
  });
  uri = uri.substring(0, uri.length - 1);
  let xml = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
   xml.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status >= 200 && this.status < 300) {
     resolve(this);
    } else {
     reject({
      rejectCode: this.status,
      rejectReason: this.responseText
     })
    }
   };
   xml.open("GET", uri, true);
   xml.send();
  });
 }
}

export {
 XMLHttp
};
