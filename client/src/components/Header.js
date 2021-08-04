import React from 'react';
import './Header.scss';

export default function Header() {
  return (
    <header className="header">
      <h2 className="header__text-1"><span className="header__text-2">OCW Team </span>Canvas Intelligence</h2>
      <a className="header__text-3" href="/google/logout">Log out</a>
    </header>
  );
}
