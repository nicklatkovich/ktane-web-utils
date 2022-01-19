import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, HashRouter } from "react-router-dom";

import "./styles/index.scss";
import { AppComponent } from "./App";
// import { history, store } from "./store";
import { store } from "./store";
// import { ConnectedRouter } from "connected-react-router";

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      {/* <HashRouter> */}
      <BrowserRouter basename={process.env.PUBLIC_URL}>
      {/* <ConnectedRouter history={history}> */}
        <AppComponent />
      {/* </ConnectedRouter> */}
      </BrowserRouter>
      {/* </HashRouter> */}
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);
