## Import file
import {XMLHttp} from "./XMLHttp";

## Create new object instance
this.ajax = new XMLHttp();

## Usage
```
this.ajax.ajaxCall(this.config).then(data => {
   // on Success
  }, (error) => {
  // on Error
  });
// async to ajaxCall
```
