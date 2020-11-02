import React from 'react';
import { Router } from "@reach/router";
import Home from './Home';
import Footer from './Footer';
import './App.scss';

export default function App() {
  return (
    <div className="app">
      <Router>
        <Home path="/" />
      </Router>
      <Footer />
    </div>
  );
};
