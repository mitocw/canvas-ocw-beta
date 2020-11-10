import { Department } from './Department';
import { Teacher } from './Teacher';

export class Courseware {
    name;
    url;
    department;
    teachers;

    constructor(courseware) {
        this.name = courseware.name;
        this.url = courseware.url;
        this.department = new Department(courseware.department);
        this.teachers = [];
        courseware.teachers.forEach(teacher => {
            this.teachers.push(new Teacher(teacher));
        });
    }
}
