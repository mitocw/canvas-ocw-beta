import { Video } from './Video';

export class Videos {
    constructor(videos) {
        videos.forEach((video) => {
            this[video.id] =  new Video(video);
        });
    }
}
