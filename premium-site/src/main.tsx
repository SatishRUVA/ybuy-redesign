import React from 'react';
import { createRoot } from 'react-dom/client';
// Must load first: it declares the cascade layer order used by every flow stylesheet.
import './styles.css';
import App from './App';
import { DemoProvider } from './flows/store';

const root = document.getElementById('root');
if (!root) throw new Error('The premium site root element is missing.');
createRoot(root).render(<React.StrictMode><DemoProvider><App /></DemoProvider></React.StrictMode>);
