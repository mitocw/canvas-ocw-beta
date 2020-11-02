import httpClient from './httpClient';
import { Videos } from '../models/Videos';

export class SearchService {
    endpoint = '/search';
    
    search(query) {
        const formData = new FormData();
        formData.set('query', query);
        const url = `${this.endpoint}`;
        return httpClient.post(url, formData)
            .then(response => {
                return new Videos(response.data);
            });
    }
}

const searchService = new SearchService();
export default searchService;
