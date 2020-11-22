import React, { useEffect, useState } from 'react';
import { Button } from '@rmwc/button';
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
            if (courseware.department && courseware.department.name) {
              const name = courseware.department.name;
              departments.push({
                label: name,
                value: name
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
          return courseware.department && courseware.department.name && courseware.department.name === department;
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
  
  return (
    <main className="home">
      <TextField
        className="home__search-text-field"
        placeholder="Find courseware by instructor from across MIT's Canvas"
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
      {showContext && <Context/>}
      {resultsEl}
    </main>
  );
}
