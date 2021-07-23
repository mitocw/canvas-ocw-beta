import React, { useEffect, useState } from 'react';
import { MdFileUpload, MdOpenInNew } from 'react-icons/md';
import ReactPaginate from 'react-paginate';
import { Button } from '@rmwc/button';
import { Drawer, DrawerContent } from '@rmwc/drawer';
import { Radio } from '@rmwc/radio';
import { Select } from '@rmwc/select';
import { TextField } from '@rmwc/textfield';
import { SpreadsheetRow } from '../core/models/SpreadsheetRow';
import departmentService from '../core/services/DepartmentService';
import searchService from '../core/services/SearchService';
import spreadsheetService from '../core/services/SpreadsheetService';
import shortid from '../utils/shortid';
import CoursewareCard from './CoursewareCard';
import Context from './Context';
import './Home.scss';

export default function Home() {
  const coursewarePerPage = 4;
  const [query, setQuery ] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [coursewares, setCoursewares] = useState([]);
  const [resultsMessage, setResultsMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showContext, setShowContext ] = useState(true);
  const [department, setDepartment] = useState('All');
  const [departmentOptions, setDepartmentOptions] = useState([{ label: 'All', value: 'All' }]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coursewareUrl, setCoursewareUrl] = useState('');
  const [coursewareId, setCoursewareId] = useState('');
  const [candidate, setCandidate] = useState('yes');
  const [copyright, setCopyright] = useState('yes');
  const [comment, setComment] = useState('');
  const [spreadsheetRows, setSpreadsheetRows] = useState([]);
  const [offset, setOffset] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  
  useEffect(() => {
    const loadCoursewares = async () => {
      setResultsMessage('');
      setErrorMessage('');
      setIsLoading(true);
      setIsError(false);
      try {
        // Get total number of coursewares for search and department
        const totalCoursewares = await searchService.getToTalCoursewares(search, department);
        // Get coursewares by page
        const coursewares = await searchService.search(search, department, offset, coursewarePerPage);
        setShowContext(false);
        setCoursewares(coursewares);
        setResultsMessage(coursewares.length > 0 ?
          'Results from MIT\'s Canvas.' :
          `Sorry, we didn’t find any results for "${search}" term.`
        );
         // Set number of pages
         setPageCount(Math.ceil(totalCoursewares / coursewarePerPage));
      } catch(error) {
        setIsError(true);
        setErrorMessage(`Sorry, we didn't find any results for "${search}" term.`)
      }
      setIsLoading(false);
    };
    loadCoursewares();
  }, [search, department, offset, setPageCount]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
          const depts = await departmentService.load();
          let departments = [];
          depts.forEach((dept) => {
            departments.push({
              label: dept,
              value: dept
            });
          });
          setDepartmentOptions([{ label: 'All', value: 'All' }, ...departments]);
      } catch(error) {
        console.log('An error occured', error);
      }
    };
    loadDepartments();
  }, []);

  useEffect(() => {
    const loadSpreadsheetRows = async () => {
      try {
        // Do not send a request for an empty string
        if (coursewareId) {
          const rows = await spreadsheetService.load(coursewareId);
          setSpreadsheetRows(rows);
        }
      } catch(error) {
        console.log('An error occured', error);
      }
    };
    loadSpreadsheetRows();
  }, [coursewareId]);

  const inputChange = (event) => setQuery(event.currentTarget.value);
  
  const inputKeyUp = (event) => {
    // 'Enter' key code
    if (event.keyCode === 13) {
      setSearch(query);
    }
  };
  
  const buttonClick = () => setSearch(query);

  const departmentChange = (event) => {
    setDepartment(event.currentTarget.value);
  };

  const handleBrowseCourseFromCard = (url) => {
    window.open(url, '_blank');
  };

  const handleViewCourseFromCard = (id, url) => {
    setCoursewareUrl(url);
    setCoursewareId(id);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    // Reset
    setCoursewareId('');
    setCoursewareUrl('');
    setCandidate('yes');
    setCopyright('yes');
    setComment('');
  };

  const handleBrowseCourse = () => {
    window.open(coursewareUrl, '_blank');
  };

  const handleCandidateChange = (event) => setCandidate(String(event.currentTarget.value));
  const handleCopyrightChange = (event) => setCopyright(String(event.currentTarget.value));
  const handleCommentChange = (event) => {
    setComment(String(event.currentTarget.value));
  }

  const handleSubmit = () => {
    const createSpreadsheetRow = async () => {
      try {
          const response = await spreadsheetService.create(coursewareId, candidate, copyright, comment);
          const newRow = new SpreadsheetRow(response);
          const rows = JSON.parse(JSON.stringify(spreadsheetRows)); // Clone
          rows.unshift(newRow);
          setSpreadsheetRows(rows);
      } catch(error) {
        console.log('An error occured', error);
      }
    };
    createSpreadsheetRow();
  };

  const handlePageChange = (data) => {
    const pageNbr = data.selected;
    const newOffset = Math.ceil(pageNbr * coursewarePerPage);
    setOffset(newOffset);
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
    const coursewaresEl = coursewares.map((courseware) => (
      <CoursewareCard
        key={shortid()}
        id={courseware.id}
        title={courseware.name}
        url={courseware.url}
        instructors={courseware.teachers}
        modules={courseware.modules}
        assignments={courseware.assignments}
        quizzes={courseware.quizzes}
        files={courseware.files}
        onBrowseCourse={handleBrowseCourseFromCard}
        onViewCourse={handleViewCourseFromCard}
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

  const spreadsheetRowsEl = spreadsheetRows.map((row) => (
    <div className="home__course-drawer-spreadsheet-row" key={shortid()}>
      <div>{row.date}</div>
      <div>Publication candidate: {row.publicationCandidate}</div>
      <div>Minimal copyright: {row.minimalCopyright}</div>
      <div>Comment: {row.comment}</div>
    </div>
  ))

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
                className="home__course-drawer-browse-button"
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
              rows={4}
              textarea
              value={comment}
              onChange={handleCommentChange}
            />
          </div>
          <Button
            className="home__course-drawer-submit-button"
            label="Submit"
            trailingIcon={<MdFileUpload className="home__course-drawer-icon" />}
            onClick={handleSubmit}
          />
          <div className="home__course-drawer-spreadsheet-rows">
            {spreadsheetRowsEl}
          </div>
        </DrawerContent>
      </Drawer>
      {showContext && <Context/>}
      {resultsEl}
      {pageCount > 1 &&
        <ReactPaginate
          previousLabel="Previous"
          nextLabel="Next"
          breakLabel="..."
          pageCount={pageCount}
          marginPagesDisplayed={3}
          pageRangeDisplayed={3}
          onPageChange={handlePageChange}
          containerClassName="home__pagination"
          pageLinkClassName="home__pagination-page-link"
          activeLinkClassName="home__pagination-active-link"
          previousLinkClassName="home__pagination-previous-link"
          nextLinkClassName="home__pagination-next-link"
          disabledLinkClassName="home__pagination-disabled-link"
          breakLinkClassName="home__pagination-break-link"
        />
      }
    </main>
  );
}
