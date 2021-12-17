const canvasUrl = 'https://mit.test.instructure.com/courses'

export class Courseware {
    name;
    url;
    department;
    term;
    teachers;
    modules; // number
    assignments; // number
    quizzes; // number
    files; //number

    constructor(courseware) {
        this.id = courseware['id'];
        this.name = courseware['name'];
        this.url = `${canvasUrl}/${courseware['id']}`;
        this.department = courseware['dept'];
        this.term = courseware['enrollment_term'];
        this.teachers = [];
        this.modules = courseware['n_modules'];
        this.assignments = courseware['n_assignments'];
        this.quizzes = courseware['n_quizzes'];
        this.files = courseware['n_files'];
    }
}
