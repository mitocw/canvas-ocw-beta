import httpClient from './httpClient';
import { Courseware } from '../models/Courseware';

export class SearchService {
    endpoint = '/search';
    
    search(query, department, offset, limit) {
        const formData = new FormData();
        formData.set('query', query);
        formData.set('department', department);
        const url = `${this.endpoint}`;
        return httpClient.post(url, formData, { params: { offset, limit }})
            .then(response => {
                const coursewares = response.data.coursewares;
                return coursewares.map(courseware => new Courseware(courseware));
            });
    }

    getToTalCoursewares(query, department) {
        const formData = new FormData();
        formData.set('query', query);
        formData.set('department', department);
        const url = `${this.endpoint}`;
        return httpClient.post(url, formData, null)
            .then(response => {
                return response.data.total_coursewares;
            });
    }
}

const searchService = new SearchService();
export default searchService;
