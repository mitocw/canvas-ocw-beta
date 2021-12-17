import httpClient from './httpClient';

export class TermService {
    endpoint = '/terms';
    
    load() {
        const url = `${this.endpoint}`;
        return httpClient.get(url)
            .then(response => {
                return response.data;
            });
    }
}

const termService = new TermService();
export default termService;
