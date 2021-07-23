export class SpreadsheetRow {
    coursewareId;
    publicationCandidate;
    minimalCopyright;
    comment;
    date;

    constructor(row) {
        this.coursewareId = row['courseware_id'];
        this.publicationCandidate = row['publication_candidate'];
        this.minimalCopyright = row['minimal_copyright'];
        this.comment = row['comment'];
        this.date = row['date'];
    }
}
