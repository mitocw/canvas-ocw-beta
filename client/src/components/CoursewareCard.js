import React from 'react';
import { Card } from '@rmwc/card';
import shortid from '../utils/shortid';
import './CoursewareCard.scss';

export default function CoursewareCard(props) {
  const { title, url, instructors, modules, assignments, quizzes, onViewCourse } = props;
  const lastIndex = instructors.length - 1;
  const instructorsEl = instructors.map((instructor, index) => {
    if (index !== lastIndex) {
      return <span key={shortid()}>{instructor.displayName},&nbsp;</span>;
    } else {
      return <span key={shortid()}>{instructor.displayName}</span>;
    }
  });
  const subFieldsStr = `Modules: ${modules} | Assignments: ${assignments} | Quizzes: ${quizzes}`;
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onViewCourse(url);
  }
  
  return (
      <Card className="courseware-card">
        <a className="courseware-card__link"  href={url} onClick={handleClick}>{title}</a>
        <p className="courseware-card__instructors">
          <span className="courseware-card__instructors-title">Instructors: </span> {instructorsEl}
        </p>
        <p className="courseware-card__subfields">
          <span className="courseware-card__subfields">{subFieldsStr}</span>
        </p>
      </Card>
  );
}
