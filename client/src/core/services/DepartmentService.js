import httpClient from './httpClient';

export class DepartmentService {
    endpoint = '/departments';
    
    load() {
        const url = `${this.endpoint}`;
        return httpClient.get(url)
            .then(response => {
                return response.data;
            });
    }
}

const departmentService = new DepartmentService();
export default departmentService;
