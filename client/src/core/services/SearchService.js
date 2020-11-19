import httpClient from './httpClient';
import { Courseware } from '../models/Courseware';

export class SearchService {
    endpoint = '/search';
    
    search(query) {
        const formData = new FormData();
        formData.set('query', query);
        const url = `${this.endpoint}`;
        return httpClient.post(url, formData)
            .then(response => {
                return response.data.map(courseware => new Courseware(courseware));
            });
    }
}

const searchService = new SearchService();
export default searchService;
