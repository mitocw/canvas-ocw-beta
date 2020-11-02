import React from 'react';
import './Footer.scss';

export default function Footer() {
  return (
    <footer className="footer">
      <h2 className="footer__text-1">MIT <span className="footer__text-2">Open</span>CourseWare</h2>
      <p className="footer__text-3">
        Your use of the MIT OpenCourseWare site and materials is
        subject to our
        {' '}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons License</a>
        {' '}
        and other
        {' '}
        <a href="https://ocw.mit.edu/terms/">terms of use</a>
        .
    </p>
    </footer>
  );
}
