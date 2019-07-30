import {XMLHttp} from "./XMLHttp";

class Builder {

 /**
  *
  * @param div {Element} Builder element in which the content shall be build
  * @param id {number} builder identifier
  * @param config {Array} Build config for the xml request
  */
 constructor(div, id, config) {
  this.div = div;
  this.id = id;
  this.config = [];
  this.relocateOption = config['method'];
  let tempConfig = Object.entries(Object.assign({}, config));
  tempConfig = tempConfig.filter(item => {
   return item[0] !== 'method';
  });
  tempConfig.forEach(item => {
   this.config[item[0]] = item[1];
  });
  this.ajax = new XMLHttp();
  if (config['status'] === "list") {
   this.createList();
  } else {
   this.createDetail();
  }
 }

 createList() {
  this.ajax.ajaxCall(this.config).then(data => {
   this.bindHtmlList(data);
  }, (error) => {
   console.log('error');
   console.log(error);
  });
  this.div.innerHTML = this.div.getAttribute('type');
 }

 bindHtmlList(data) {
  this.div.innerHTML = data.responseText;
  /* Remove a href */
  if (!this.relocateOption) {
   let hrefs = this.div.getElementsByTagName('a');
   for (let item of hrefs) {
    item.href = "#";
   }
  }
  let rows = this.div.getElementsByClassName('eb_remote_list_table_row');
  /* add click listener for details view*/
  for (let item of rows) {
   item.onclick = (e) => {
    if (!this.relocateOption) {
     if (e.srcElement.tagName === 'A') {
      this.relocate(e.path[2].getAttribute('value'));
     } else {
      this.relocate(e.path[1].getAttribute('value'));
     }
    } else {
     this.relocate(e.path[1].getAttribute('value'));
    }
   }
  }
  let header = this.div.getElementsByTagName('th');
  /* add click listener for sort order*/
  for (let item of header) {
   item.onclick = (e) => {
    this.orderBy(e.path[0].getAttribute('value'));
   }
  }
  let pagination = this.div.getElementsByClassName("eb_remote_list_pagination").item(0);
  let realPag = Array.from(pagination.children);
  for (let item of realPag) {
   item.onclick = (e) => {
    this.pagination(e.path[0].getAttribute('value'));
   }
  }
 }

 relocate(id) {
  if (this.relocateOption) {
   if (window.location.search.length > 0) {
    window.location.href = window.location.href + '&eb_remote_id=' + id;
   } else {
    window.location.href = window.location.origin + window.location.pathname + '?eb_remote_id=' + id;
   }
  } else {
   localStorage.setItem('eb_remote_id', id);
   location.reload();
  }
 }

 orderBy(sortOrder) {
  this.config['order'] = sortOrder;
  this.createList();
 }

 pagination(toPage) {
  this.config['curPage'] = toPage;
  this.createList();
 }

 createDetail() {
  this.ajax.ajaxCall(this.config).then((data) => {
   this.detailsData = JSON.parse(data.responseText);
   window.onresize = () => {
    this.buildTable();
   };
   this.buildTable();
  });
 }

 buildTable() {
  if (!this.oldWidth || Math.abs(this.oldWidth - innerWidth) > 10 ||
      (this.oldWidth < 560 && innerWidth > 560) || (this.oldWidth < 750 && innerWidth > 750) ||
      (this.oldWidth > 560 && innerWidth < 560) || (this.oldWidth > 750 && innerWidth < 750)) {
   let table = document.createElement("table");
   table.setAttribute('class', 'eb_remote_details_table');
   let header = table.createTHead();
   let headerRow = header.insertRow();
   headerRow.innerHTML = '<th>Merkmal</th><th>ZW</th>';
   if (window.innerWidth > 750 && window.outerWidth > 750) {
    headerRow.innerHTML += '<th>Extrem</th>';
   }
   if (window.innerWidth > 560 && window.outerWidth > 560) {
    for (let scale of this.detailsData.a_scale) {
     headerRow.innerHTML += '<th colspan="2">' + scale + '</th>';
    }
   }
   if (window.innerWidth > 750 && window.outerWidth > 750) {
    headerRow.innerHTML += '<th>Extrem</th>';
   }
   let body = table.createTBody();
   let aextzwEntries = Object.entries(this.detailsData.aextzw);
   let rowIterator = 0;
   for (let item of aextzwEntries) {
    let row = body.insertRow();
    let value = this.detailsData.row[item[0]];
    if (this.detailsData.a_trenn) {
     if (this.detailsData.a_trenn[row.rowIndex]) {
      row.setAttribute("class", row.getAttribute("class") ? row.getAttribute("class") + " eb_remote_hasHyphen" : "eb_remote_hasHyphen")
     }
    }
    if (rowIterator < this.detailsData.extwoben) {
     row.setAttribute("class", row.getAttribute("class") ? row.getAttribute("class") + " eb_remote_special" : "eb_remote_special");
    }
    row.setAttribute("data", value);
    let extremeIterator = 0;
    for (let headerCell of headerRow.cells) {
     let cell = row.insertCell();
     switch (headerCell.innerText) {
      case 'Merkmal':
       cell.innerText = item[1];
       break;
      case 'ZW':
       cell.innerText = value;
       break;
      case 'Extrem':
       if (extremeIterator) {
        cell.innerText = this.detailsData.aextzw_minmax[item[0]].max;
       } else {
        cell.innerText = this.detailsData.aextzw_minmax[item[0]].min;
       }
       cell.setAttribute("class", cell.getAttribute("class") ? cell.getAttribute("class") + " eb_remote_padding" : "eb_remote_padding");
       extremeIterator++;
       break;
      default:
       let cell2 = row.insertCell();
       cell.setAttribute("class", cell.getAttribute("class") ? cell.getAttribute("class") + " eb_remote_before" : "eb_remote_before");
       cell2.setAttribute("class", cell2.getAttribute("class") ? cell2.getAttribute("class") + " eb_remote_after" : "eb_remote_after");
     }
    }
    rowIterator++;
   }
   let cellsOfHeader = table.rows.item(0).cells;
   let itemToGet;
   for (let i = 0; i < cellsOfHeader.length; i++) {
    if (cellsOfHeader.item(i).innerHTML === "100") {
     itemToGet = i;
    }
   }
   itemToGet = (window.innerWidth > 750 && window.outerWidth > 750) ? itemToGet * 2 - 2 : itemToGet * 2 - 1;
   this.div.innerHTML = "";
   this.div.insertAdjacentElement("afterbegin", table);
   if (window.innerWidth > 560 && window.outerWidth > 560) {
    // bars
    for (let row of table.rows) {
     if (row.children.item(0).innerHTML !== 'Merkmal') {
      let cell;
      let value = row.getAttribute("data");
      if (value) {
       cell = row.cells.item(itemToGet);
       let maxVal = this.detailsData.a_scale[this.detailsData.a_scale.length - 1];
       let minVal = this.detailsData.a_scale[0];
       let width;
       let unit = 100 / 6;
       if (value > maxVal) {
        width = unit * (maxVal - 100);
       } else if (maxVal >= value <= minVal) {
        width = unit * (value - 100); // width = pxPerUnit * (value - baseValue)
       } else {
        width = unit * (minVal - 100);
       }
       let box;
       let classCSS = 'eb_remote_box';
       if (row.getAttribute("class")) {
        if (row.getAttribute("class").includes('special')) {
         classCSS += ' eb_remote_specialBox';
        }
       }
       if (width > 0) {
        box = "<div class='" + classCSS + "' style='width: " + width + "%;'>";
       } else {
        box = "<div class='" + classCSS + "' style='width: " + width * -1 + "%; margin-left: " + width + "% '>";
       }
       cell.innerHTML = box;
      }
     }
    }
    for (let item of Object.entries(this.detailsData.a_ext_opt)) {
     item = item[1];
     let row = table.rows.item(item[0]);
     let units = item[2] - item[1];
     let cell = row.cells.item(itemToGet);
     let width = (cell.clientWidth / 6) * units;
     let box = "<div class='eb_remote_optimum' style='width: " + width + "px;margin-left: " + (((item[1] - 100) * (cell.clientWidth / 6)) - 1) + "px'>";
     cell.innerHTML += box;
    }
   }
   this.oldWidth = window.innerWidth;
  }
 }
}

export {Builder};
