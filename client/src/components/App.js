import React from 'react';
import { Router } from "@reach/router";
import Header from './Header';
import Home from './Home';
import Footer from './Footer';
import './App.scss';

export default function App() {
  return (
    <div className="app">
      <Header />
      <Router>
        <Home path="/" />
      </Router>
      <Footer />
    </div>
  );
};
