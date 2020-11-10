import React from 'react';
import { Card } from '@rmwc/card';
import './CoursewareCard.scss';

export default function CoursewareCard(props) {
  const { title, url, instructors } = props;
  const lastIndex = instructors.length - 1;
  const instructorsEl = instructors.map((instructor, index) => {
    if (index !== lastIndex) {
      return <span>{instructor.displayName},&nbsp;</span>;
    } else {
      return <span>{instructor.displayName}</span>;
    }
  });
  
  return (
      <Card className="courseware-card">
        <a href={url} className="courseware-card__link">{title}</a>
        <p className="courseware-card__instructors">
          <span className="courseware-card__instructors-title">Instructors: </span> {instructorsEl}
        </p>
      </Card>
  );
}
