import httpClient from './httpClient';
import { SpreadsheetRow } from '../models/SpreadsheetRow';

export class SpreadsheetService {
    endpoint = '/spreadsheet';
    
    load(coursewareId) {
        const url = `${this.endpoint}`;
        return httpClient.get(url, { params: { coursewareId } })
            .then(response => {
                return response.data.map(row => new SpreadsheetRow(row));
            });
    }

    create(coursewareId, candidate, copyright, comment) {
        const d = new Date();
        const day = `${d.getUTCMonth() + 1}-${d.getUTCDate()}-${d.getFullYear()}`;
        const time = `${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}.${d.getUTCMilliseconds()}`;
        const date =`${day} ${time}`; 
        const formData = new FormData();
        formData.set('courseware_id', coursewareId);
        formData.set('publication_candidate', candidate);
        formData.set('minimal_copyright', copyright);
        formData.set('comment', comment);
        formData.set('date', date);
        const url = `${this.endpoint}`;
        return httpClient.post(url, formData)
            .then(response => {
                return response.data;
            });
    }
}

const spreadsheetService = new SpreadsheetService();
export default spreadsheetService;
