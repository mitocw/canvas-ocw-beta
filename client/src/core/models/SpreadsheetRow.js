export class SpreadsheetRow {
    coursewareId;
    publicationCandidate;
    minimalCopyright;
    userName;
    comment;
    date;

    constructor(row) {
        this.coursewareId = row['courseware_id'];
        this.publicationCandidate = row['publication_candidate'];
        this.minimalCopyright = row['minimal_copyright'];
        this.userName = row['user_name'];
        this.comment = row['comment'];
        this.date = row['date'];
    }
}
