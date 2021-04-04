import React, { useEffect, useState } from 'react';
import { MdOpenInNew } from 'react-icons/md';
import { Button } from '@rmwc/button';
import { Drawer, DrawerContent } from '@rmwc/drawer';
import { Radio } from '@rmwc/radio';
import { Select } from '@rmwc/select';
import { TextField } from '@rmwc/textfield';
import searchService from '../core/services/SearchService';
import shortid from '../utils/shortid';
import CoursewareCard from './CoursewareCard';
import Context from './Context';
import './Home.scss';

export default function Home() {
  const timeout = 200;
  const [query, setQuery ] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [coursewares, setCoursewares] = useState([]);
  const [filteredCoursewares, setFilteredCoursewares] = useState([]);
  const [resultsMessage, setResultsMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showContext, setShowContext ] = useState(true);
  const [department, setDepartment] = useState('All');
  const [departmentOptions, setDepartmentOptions] = useState([{ label: 'All', value: 'All' }]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [courseUrl, setCourseUrl] = useState('');
  
  useEffect(() => {
    const loadCoursewares = async () => {
      setResultsMessage('');
      setErrorMessage('');
      setIsLoading(true);
      setIsError(false);
      try {
        // Do not send a request for an empty string
        if (search) {
          const coursewares = await searchService.search(search);
          setShowContext(false);
          setCoursewares(coursewares);
          setFilteredCoursewares(coursewares);
          setResultsMessage(coursewares.length > 0 ?
            'Results from MIT\'s Canvas.' :
            `Sorry, we didn’t find any results for "${search}" term.`
          );
          let departments = [];
          coursewares.forEach((courseware) => {
            if (courseware.department) {
              const { department } = courseware;
              departments.push({
                label: department,
                value: department
              })
            }
          });
          const uniqueDepartments = departments.filter(
            (elem, index) => departments.findIndex((obj) => obj.value === elem.value) === index
          );
          setDepartmentOptions([{ label: 'All', value: 'All' }, ...uniqueDepartments]);
        }
      } catch(error) {
        setIsError(true);
        setErrorMessage(`Sorry, we didn't find any results for "${search}" term.`)
      }
      setIsLoading(false);
    };
    loadCoursewares();
  }, [search]);

  useEffect(
    () => {
      let newFilteredCoursewares;
      if (department === 'All') {
        newFilteredCoursewares = coursewares;
      }
      else if (coursewares && coursewares.length) {
        newFilteredCoursewares = coursewares.filter((courseware) => {
          return courseware.department && courseware.department === department;
        });
      }
      setTimeout(() => setFilteredCoursewares(newFilteredCoursewares), timeout);
    },
    [department, coursewares]
  );

  const inputChange = (event) => setQuery(event.currentTarget.value);
  
  const inputKeyUp = (event) => {
    // 'Enter' key code
    if (event.keyCode === 13) {
      setSearch(query);
    }
  }
  
  const buttonClick = () => setSearch(query);

  const departmentChange = (event) => {
    setDepartment(event.currentTarget.value);
  }

  const handleViewCourse = (url) => {
    setCourseUrl(url);
    setDrawerOpen(true);
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setCourseUrl('');
  }

  const handleBrowseCourse = () => {
    console.log(courseUrl)
    window.open(courseUrl, '_blank');
  }

  let resultsEl;

  if (isLoading) {
    resultsEl = (
      <div className="home__loading-message">
        Loading...
      </div>
    );
  } else if (isError) {
    resultsEl = (
      <div className="home__error-message">
          {errorMessage}
      </div>
    );
  } else {
    const coursewaresEl = filteredCoursewares.map((courseware) => (
      <CoursewareCard
        key={shortid()}
        title={courseware.name}
        url={courseware.url}
        instructors={courseware.teachers}
        modules={courseware.modules}
        assignments={courseware.assignments}
        quizzes={courseware.quizzes}
        onViewCourse={handleViewCourse}
      />
    ))
    resultsEl = (
      <>
        <div className="home__results-message">
          {resultsMessage}
        </div>
        <div>
          {coursewaresEl}
        </div>
        
      </>
    );
  }
  const [candidate, setCandidate] = useState('yes');
  const [copyright, setCopyright] = useState('yes');

  const handleCandidateChange = (event) => setCandidate(String(event.currentTarget.value));
  const handleCopyrightChange = (event) => setCopyright(String(event.currentTarget.value));

  return (
    <main className="home">
      <TextField
        className="home__search-text-field"
        placeholder="Search course names, numbers"
        outlined
        value={query}
        onChange={inputChange}
        onKeyUp={inputKeyUp}
      />
      <Button className="home__search-button" label="Search" unelevated onClick={buttonClick}/>
      <Select
        className="home__department-filter"
        enhanced
        outlined
        label="Department"
        value={department}
        options={departmentOptions}
        onChange={departmentChange}
      />
      <Drawer
        dir="rtl"
        modal
        open={drawerOpen}
        onClose={handleDrawerClose}
      >
        <DrawerContent className="home__course-drawer-content" dir="ltr">
          <div className="home__course-drawer-subcontent">
            <div className="home__course-drawer-subcontent-header">
              <h4 className="home__course-drawer-subtitle">Publication Candidate?</h4>
              <Button
                className="home__course-drawer-button"
                label="Browse Course"
                trailingIcon={<MdOpenInNew className="home__course-drawer-icon" />}
                onClick={handleBrowseCourse}
              />
            </div>
            <div className="home__course-drawer-radio-buttons">
              <Radio
                className="home__course-drawer-radio-button"
                value="yes"
                checked={candidate === 'yes'}
                onChange={handleCandidateChange}
              >
                Yes
              </Radio>
              <Radio
                className="home__course-drawer-radio-button"
                value="no"
                checked={candidate === 'no'}
                onChange={handleCandidateChange}
              >
                No
              </Radio>
              <Radio
                className="home__course-drawer-radio-button"
                value="unsure"
                checked={candidate === 'unsure'}
                onChange={handleCandidateChange}
              >
                Unsure
              </Radio>
            </div>
          </div>
          <div className="home__course-drawer-subcontent">
            <h4 className="home__course-drawer-subtitle">Minimal Copyright</h4>
            <div  className="home__course-drawer-radio-buttons">
              <Radio
                className="home__course-drawer-radio-button"
                value="yes"
                checked={copyright === 'yes'}
                onChange={handleCopyrightChange}
              >
                Yes
              </Radio>
              <Radio
                className="home__course-drawer-radio-button"
                value="no"
                checked={copyright === 'no'}
                onChange={handleCopyrightChange}
              >
                No
              </Radio>
              <Radio
                className="home__course-drawer-radio-button"
                value="unsure"
                checked={copyright === 'unsure'}
                onChange={handleCopyrightChange}
              >
                Unsure
              </Radio>
            </div>
          </div>
          <div className="home__course-drawer-subcontent">
            <h4 className="home__course-drawer-subtitle">Teamwide Comment</h4>
            <TextField
              className="home__course-drawer-text-area"
              fullwidth
              outlined
              placeholder="Comment on the readiness of this course for publication on OpenCourseWare."
              rows={10}
              textarea
            />
          </div>
        </DrawerContent>
    </Drawer>
      {showContext && <Context/>}
      {resultsEl}
    </main>
  );
}
