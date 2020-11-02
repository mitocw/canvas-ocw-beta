import React, { useRef, useState } from 'react';
import { Button } from '@rmwc/button';
import { TextField } from '@rmwc/textfield';
import truncate from 'truncate';
import './VideoCard.scss';

export default function VideoCard(props) {
  const { description, duration, id, thumbnail, title } = props;
  const baseUrl = `https://www.youtube.com/embed/${id}`;
  const [url, setUrl] = useState(baseUrl)
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [width, setWidth] = useState('560');
  const [height, setHeight] = useState('315');
  const [open, setOpen] = useState(false);
  const formEl = useRef(null);

  const embed = () => {
    formEl.current.submit();
  };

  const selectClip = () => {
    setOpen(!open);
  };

  const embedClip = () => {
    setOpen(false);
    const clipUrl = `${baseUrl}?start=${start}&end=${end}`;
    setUrl(clipUrl);
    setTimeout(() => formEl.current.submit(), 1000);
  };

  const inputChange = (event) => {
    const name = event.currentTarget.name;
    const value = event.currentTarget.value;
    
    switch(name) {
      case 'start':
        setStart(value);
        break;
      case 'end':
        setEnd(value);
        break;
      case 'width':
        setWidth(value);
        break;
      case 'height':
        setHeight(value);
        break;
      default:
    }
  }
  
  return (
    <>
      <div className="video-card">
        <img
          className="video-card__image"
          src={thumbnail}
          alt={title}
          tabIndex="0"
          role="button"
        />
        <div className="video-card__content">
          <div className="video-card__title">{truncate(title, 40)}</div>
          <div className="video-card__description">{truncate(description, 140)}</div>
          <div className="video-card__footer">
            <div className="video-card__buttons">
              <Button className="video-card__button" label="EMBED NOW" unelevated onClick={embed} />
              <Button className="video-card__button" label="SELECT CLIP" unelevated onClick={selectClip} />
            </div>
            <span className="video-card__duration">{duration} mins</span>
          </div>

          <form
            action={window.contentItemReturnUrl}
            id={`lti-content-item-return-form-${id}`}
            method="POST"
            encType="application/x-www-form-urlencoded"
            ref={formEl}
          >
            <input type="hidden" name="return_type" value="iframe" />
            <input type="hidden" name="url" value={url} />
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="width" value={width} />
            <input type="hidden" name="height" value={height} />
          </form>
        </div>
      </div>
      {open && (
        <div className="video-select">
          <div className="video-container">
            <iframe
                className="video-iframe"
                width="965"
                height="543"
                title={title}
                src={`https://www.youtube.com/embed/${id}`}
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
          </div>
          <div className="video-controls">
            <TextField
              className="video-controls__text-field"
              label="Start"
              placeholder="e.g., 60"
              name="start"
              outlined
              value={start}
              onChange={inputChange}
            />
            <TextField
              className="video-controls__text-field"
              label="End"
              name="end"
              placeholder="e.g., 60"
              outlined
              value={end}
              onChange={inputChange}
            />
            <TextField
              className="video-controls__text-field"
              label="Width"
              name="width"
              placeholder="e.g., 560"
              outlined
              value={width}
              onChange={inputChange}
            />
            <TextField
              className="video-controls__text-field"
              label="Height"
              name="height"
              placeholder="e.g., 315"
              outlined
              value={height}
              onChange={inputChange}
            />
            <Button
              className="video-controls__embed"
              label="EMBED CLIP"
              unelevated
              onClick={embedClip}
            />
          </div>
        </div>
      )}
    </>
  );
}
