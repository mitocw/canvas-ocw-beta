export class SpreadsheetRow {
    coursewareId;
    publicationCandidate;
    minimalCopyright;
    userName;
    userPicture;
    comment;
    date;

    constructor(row) {
        this.coursewareId = row['courseware_id'];
        this.publicationCandidate = row['publication_candidate'];
        this.minimalCopyright = row['minimal_copyright'];
        this.userName = row['user_name'];
        this.userPicture = row['user_picture'];
        this.comment = row['comment'];
        this.date = row['date'];
    }
}
