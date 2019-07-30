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

 /**
  * @description ajax call with promise, as soon as the promise was successful call bindHtmlList
  */
 createList() {
  this.ajax.ajaxCall(this.config).then(data => {
   this.bindHtmlList(data.responseText);
  }, (error) => {
   console.log('error');
   console.log(error);
  });
  this.div.innerHTML = this.div.getAttribute('type');
 }

 /**
  * @description binds the list onto the html and creates all click listener
  * @param data {string}
  */
 bindHtmlList(data) {
  // complete list structure
  this.div.innerHTML = data;
  /* Remove hrefs from a tags when the relocation is via the localstorage*/
  if (!this.relocateOption) {
   let hrefs = this.div.getElementsByTagName('a');
   for (let item of hrefs) {
    item.href = "#";
   }
  }

  /* add click listener for details view*/
  let rows = this.div.getElementsByClassName('eb_remote_list_table_row');
  for (let item of rows) {
   item.onclick = (e) => {
    // when the relocateOption is local then the a tag is not functional but should also work with the onClick.
    // But due to the path being incorrect when clicking on the a tag another path will be selected
    if (!this.relocateOption) {
     if (e.srcElement.tagName === 'A') {
      this.relocate(e.srcElement.parentElement.parentElement.getAttribute('value'));
     } else {
      this.relocate(e.srcElement.parentElement.getAttribute('value'));
     }
    } else {
     this.relocate(e.srcElement.parentElement.getAttribute('value'));
    }
   }
  }

  /* add click listener for sort order*/
  let header = this.div.getElementsByTagName('th');
  for (let item of header) {
   item.onclick = (e) => {
    this.orderBy(e.srcElement.getAttribute('value'));
   }
  }

  /* add click listener for the pagination children*/
  let pagination = this.div.getElementsByClassName("eb_remote_list_pagination").item(0);
  let realPag = Array.from(pagination.children);
  for (let item of realPag) {
   item.onclick = (e) => {
    this.pagination(e.srcElement.getAttribute('value'));
   }
  }
 }

 /**
  * on detail click
  * @description either reloads the window with a new get parameter or sets a parameter into the localStorage and force reloads the page
  * @param id
  */
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

 /**
  * on order by click
  * @description changes the config of the sort order accordingly and calls createList()
  * @param sortOrder
  */
 orderBy(sortOrder) {
  this.config['order'] = sortOrder;
  this.createList();
 }

 /**
  * on pagination click
  * @description changes the config of the current page accordingly and calls createList()
  * @param toPage
  */
 pagination(toPage) {
  this.config['curPage'] = toPage;
  this.createList();
 }

 /**
  * @description ajax call with promise, as soon as the promise was successful call buildTable() and create a resize listener, which calls buidlTable() as well
  */
 createDetail() {
  this.ajax.ajaxCall(this.config).then((data) => {
   this.detailsData = JSON.parse(data.responseText);
   window.onresize = () => {
    this.buildTable();
   };
   this.buildTable();
  });
 }

 /**
  * @description build the complete exterior table
  */
 buildTable() {
  /* Build the table only when there were at least 10 px difference between the last resize and the current.
   * This decreases to count on how often the table will be build to effectively 10%
  */
  if (!this.oldWidth || Math.abs(this.oldWidth - innerWidth) > 10 ||
      (this.oldWidth < 560 && innerWidth > 560) || (this.oldWidth < 750 && innerWidth > 750) ||
      (this.oldWidth > 560 && innerWidth < 560) || (this.oldWidth > 750 && innerWidth < 750)) {
   // creates the table and sets its class to eb_remote_details_table
   let table = document.createElement("table");
   table.setAttribute('class', 'eb_remote_details_table');
   // create the header with its only row fill these with Merkmal and ZW
   let header = table.createTHead();
   let headerRow = header.insertRow();
   headerRow.innerHTML = '<th>Merkmal</th><th>ZW</th>';
   // if the window width is greater than 750 then there will be an 2 extra columns called Extrem
   if (window.innerWidth > 750 && window.outerWidth > 750) {
    headerRow.innerHTML += '<th class="eb_remote_padding">Extrem</th>';
   }
   // if the window width is greater than 560 than there will be x extra columns which represents the bar chart
   if (window.innerWidth > 560 && window.outerWidth > 560) {
    for (let scale of this.detailsData.a_scale) {
     // there has to be a colspan of 2 due to easier formatting later on
     headerRow.innerHTML += '<th colspan="2">' + scale + '</th>';
    }
   }
   // as above insert the second Extrem value
   if (window.innerWidth > 750 && window.outerWidth > 750) {
    headerRow.innerHTML += '<th class="eb_remote_padding">Extrem</th>';
   }
   // create the body
   let body = table.createTBody();
   // query through all aextzw value (the values a bull has in a certain trait) and create for each row a value
   let aextzwEntries = Object.entries(this.detailsData.aextzw);
   let rowIterator = 0;
   for (let item of aextzwEntries) {
    let row = body.insertRow();
    let value = this.detailsData.row[item[0]];
    // if there are hyphens for this exact row add a class called eb_remote_hasHyphen
    if (this.detailsData.a_trenn) {
     if (this.detailsData.a_trenn[row.rowIndex]) {
      row.setAttribute("class", row.getAttribute("class") ? row.getAttribute("class") + " eb_remote_hasHyphen" : "eb_remote_hasHyphen")
     }
    }
    // if there are any special columns add a class to the row called eb_remote_special
    if (rowIterator < this.detailsData.extwoben) {
     row.setAttribute("class", row.getAttribute("class") ? row.getAttribute("class") + " eb_remote_special" : "eb_remote_special");
    }
    // set the row data attribute to the ZW value of the current trait
    row.setAttribute("data", value);
    let extremeIterator = 0;
    // iterate through all headerRow cells and for each create 1 or 2 cells
    for (let headerCell of headerRow.cells) {
     let cell = row.insertCell();
     switch (headerCell.innerText) {
      case 'Merkmal':
       // if the header text is Merkmal insert the real text the trait is called into the cell
       cell.innerText = item[1];
       break;
      case 'ZW':
       // if the header text is ZW insert the value of the current trait
       cell.innerText = value;
       cell.setAttribute("class", cell.getAttribute("class") ? cell.getAttribute("class") + " eb_remote_zw" : "eb_remote_zw");
       break;
      case 'Extrem':
       // if the header text is Extrem insert either if the extremeIterator is 0  the minimum extrem value otherwise if it is 1 insert the maximum extreme value
       if (!extremeIterator) {
        cell.innerText = this.detailsData.aextzw_minmax[item[0]].min;
       } else {
        cell.innerText = this.detailsData.aextzw_minmax[item[0]].max;
       }
       // set an additional class to all extreme cells otherwise the would be to tight to read
       cell.setAttribute("class", cell.getAttribute("class") ? cell.getAttribute("class") + " eb_remote_padding" : "eb_remote_padding");
       extremeIterator++;
       break;
      default:
       // if the header text is something else e.g. the bar chart then insert two cells and add the class eb_remote_before to the first cell and the class eb_remote_after to the second cell
       let cell2 = row.insertCell();
       cell.setAttribute("class", cell.getAttribute("class") ? cell.getAttribute("class") + " eb_remote_before" : "eb_remote_before");
       cell2.setAttribute("class", cell2.getAttribute("class") ? cell2.getAttribute("class") + " eb_remote_after" : "eb_remote_after");
     }
    }
    rowIterator++;
   }

   /* get all cells of the header and query them then if there are Extreme cells multiply by 2 and subtract by two otherwise multiply by 3 and subtract by 1.
    * This ensures the correct middle cell from which the bar chart will be calculated
   */
   let cellsOfHeader = table.rows.item(0).cells;
   let itemToGet;
   for (let i = 0; i < cellsOfHeader.length; i++) {
    if (cellsOfHeader.item(i).innerHTML === "100") {
     itemToGet = i;
    }
   }
   itemToGet = (window.innerWidth > 750 && window.outerWidth > 750) ? itemToGet * 2 - 2 : itemToGet * 2 - 1;

   // reset the div otherwise there would be a heccin lot tables
   this.div.innerHTML = "";
   // insert the table into the div
   this.div.insertAdjacentElement("afterbegin", table);
   // if the innerWidth is greater then 560 then the bar chart will be shown
   if (window.innerWidth > 560 && window.outerWidth > 560) {
    // create the bars
    for (let row of table.rows) {
     // security tbh I don't know if it shall be needed
     if (row.children.item(0).innerHTML !== 'Merkmal') {
      let cell;
      // get the value of the current row and check if it exists (not null)
      let value = row.getAttribute("data");
      if (value) {
       // get middle cell of the bar chart in the row
       cell = row.cells.item(itemToGet);
       // get the maximum value default it should be 136
       let maxVal = this.detailsData.a_scale[this.detailsData.a_scale.length - 1];
       // get the minimum value default it should be 64
       let minVal = this.detailsData.a_scale[0];
       let width;
       // scaling of 1 value in percent
       let unit = 100 / 6;
       if (value > maxVal) {
        // if the value is greater than the maxValue is the maxValue for the width calculation
        width = unit * (maxVal - 100);
       } else if (maxVal >= value <= minVal) {
        // if the value is in between the maxValue and the minValue then use the value
        width = unit * (value - 100);
       } else {
        // if the value is lower then the minValue then use the minValue for the width calculation
        width = unit * (minVal - 100);
       }
       let box;
       // create the classes a box has
       let classCSS = 'eb_remote_box';
       if (row.getAttribute("class")) {
        if (row.getAttribute("class").includes('special')) {
         classCSS += ' eb_remote_specialBox';
        }
       }

       // create the boxes which will be inserted into the table
       if (width > 0) {
        if (width === (unit * (maxVal - 100))) {
         box = "<div class='" + classCSS + " eb_remote_max_box' style='width: " + width + "%;'></div>";
        } else {
         box = "<div class='" + classCSS + "' style='width: " + width + "%;'></div>";
        }
       } else {
        if (width === (unit * (maxVal - 100))) {
         box = "<div class='" + classCSS + " eb_remote_min_box' style='width: " + width * -1 + "%; margin-left: " + width + "% '></div>";
        } else {
         box = "<div class='" + classCSS + "' style='width: " + width * -1 + "%; margin-left: " + width + "% '></div>";
        }
       }
       cell.innerHTML = box;
      }
     }
    }

    // create the optimum boxes
    for (let item of Object.entries(this.detailsData.a_ext_opt)) {
     item = item[1];
     let row = table.rows.item(item[0]);
     let units = item[2] - item[1];
     let cell = row.cells.item(itemToGet);
     let width = (100 / 6) * units;
     let box = "<div class='eb_remote_optimum' style='width: " + width + "%;margin-left: " + ((item[1] - 100) * (100 / 6)) + "%'></div>";
     cell.innerHTML += box;
    }
   }
   this.oldWidth = window.innerWidth;
  }
 }
}

export {Builder};
