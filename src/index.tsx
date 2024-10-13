import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { Web3Provider } from './Web3Provider';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <Web3Provider>
            <App />
        </Web3Provider>
    </React.StrictMode>,
);
