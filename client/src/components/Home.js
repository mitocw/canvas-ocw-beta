import React, { useEffect, useState } from 'react';
import { Button } from '@rmwc/button';
import { TextField } from '@rmwc/textfield';
import searchService from '../core/services/SearchService';
import shortid from '../utils/shortid';
import CoursewareCard from './CoursewareCard';
import Context from './Context';
import './Home.scss';

export default function Home() {
  const [query, setQuery ] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [coursewares, setCoursewares] = useState({});
  const [resultsMessage, setResultsMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showContext, setShowContext ] = useState(true);
  
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
          setResultsMessage(Object.keys(coursewares).length > 0 ?
            'Results from MIT\'s Canvas.' :
            `Sorry, we didn’t find any results for "${search}" term.`
          );
        }
      } catch(error) {
        setIsError(true);
        setErrorMessage(`Sorry, we didn't find any results for "${search}" term.`)
      }
      setIsLoading(false);
    };
    loadCoursewares();
  }, [search]);

  const inputChange = (event) => setQuery(event.currentTarget.value);
  
  const inputKeyUp = (event) => {
    // 'Enter' key code
    if (event.keyCode === 13) {
      setSearch(query);
    }
  }
  
  const buttonClick = () => setSearch(query);

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
    const coursewaresEl = Object.keys(coursewares).map((key) => (
      <CoursewareCard
        key={shortid()}
        title={coursewares[key].name}
        url={coursewares[key].url}
        instructors={coursewares[key].teachers}
      />
    ));
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
        className="home__search"
        placeholder="Find courseware by instructor from across MIT's Canvas"
        outlined
        value={query}
        onChange={inputChange}
        onKeyUp={inputKeyUp}
      />
      <Button label="Search" unelevated onClick={buttonClick}/>
      {showContext && <Context/>}
      {resultsEl}
    </main>
  );
}
