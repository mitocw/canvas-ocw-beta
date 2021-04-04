// TODO: reinstate teachers when present again in response
// import { Teacher } from './Teacher';

const canvasUrl = 'https://mit.test.instructure.com/courses'

export class Courseware {
    name;
    url;
    department;
    teachers;
    modules; // number
    assignments; // number
    quizzes; // number

    constructor(courseware) {
        this.name = courseware['name'];
        this.url = `${canvasUrl}/${courseware['id']}`;
        this.department = courseware['dept'];
        this.teachers = [];
        // courseware.teachers.forEach(teacher => {
        //     this.teachers.push(new Teacher(teacher));
        // });
        this.modules = courseware['n_modules'];
        this.assignments = courseware['n_assignments'];
        this.quizzes = courseware['n_quizzes'];
    }
}
