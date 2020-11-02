import React from 'react';
import './Context.scss';

export default function Context() {
  return (
    <div className="context">
      <p>
        <strong>OCW YouTube LTI Sandbox</strong> 
        <br/>
        We are gathering input from users on how best to integrate OCW into on-campus LMSs. 
        This application is under active development and may be down from time to time. 
        Current features include:
        <ul>
          <li>Search of the OCW YouTube Channel.</li>
          <li>One click embed of an OCW video directly in a Canvas page.</li>
        </ul>
      </p>
      <p>Contact us if you have more feedback, ideas, or other needs.</p>
      <p>
        <a className="context__link" href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>
        <a className="context__link" href="https://policies.google.com/privacy">Google Privacy Policy</a>
      </p>
    </div>
  );
}
