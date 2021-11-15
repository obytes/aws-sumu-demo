import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import {AuthProvider} from "./context/AuthProvider";
import {SumuProvider} from "./context/SumuProvider";

ReactDOM.render(
  <React.StrictMode>
      <AuthProvider>
          <SumuProvider>
              <App />
          </SumuProvider>
      </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
