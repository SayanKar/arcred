import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GlobalContextProvider } from "./contextProviders/GlobalContextProvider";
import { APIContextProvider } from './contextProviders/APIContextProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <GlobalContextProvider>
      <APIContextProvider>
        <App />
      </APIContextProvider>
    </GlobalContextProvider>
  </React.StrictMode>
);
