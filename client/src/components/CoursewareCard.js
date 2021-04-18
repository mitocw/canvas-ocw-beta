import React from 'react';
import { MdOpenInNew } from 'react-icons/md';
import { Card } from '@rmwc/card';
import { IconButton } from '@rmwc/icon-button';
import shortid from '../utils/shortid';
import './CoursewareCard.scss';

export default function CoursewareCard(props) {
  const { title, url, instructors, modules, assignments, quizzes, files, onBrowseCourse, onViewCourse } = props;
  const lastIndex = instructors.length - 1;
  const instructorsEl = instructors.map((instructor, index) => {
    if (index !== lastIndex) {
      return <span key={shortid()}>{instructor.displayName},&nbsp;</span>;
    } else {
      return <span key={shortid()}>{instructor.displayName}</span>;
    }
  });
  const subFieldsStr = `Modules: ${modules} | Assignments: ${assignments} | Quizzes: ${quizzes} | Files: ${files}`;
  // Event handlers
  const handleLinkClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onViewCourse(url);
  }
  const handleIconButtonClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onBrowseCourse(url);
  }
  
  return (
      <Card className="courseware-card">
        <div className="courseware-card__title">
          <a className="courseware-card__link"  href={url} onClick={handleLinkClick}>{title}</a>
          <IconButton
            className="courseware-card__icon-button"
            icon={<MdOpenInNew className="courseware-card__icon" />}
            onClick={handleIconButtonClick}
          />
        </div>
        <div className="courseware-card__instructors">
          <span className="courseware-card__instructors-title">Instructors: </span> {instructorsEl}
        </div>
        <div className="courseware-card__subfields">
          <span className="courseware-card__subfields">{subFieldsStr}</span>
        </div>
      </Card>
  );
}
