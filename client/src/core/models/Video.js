export class Video {
    duration;
    id;
    thumnbail;
    title;
    url;

    constructor(video) {
        Object.assign(this, video);
    }
}
