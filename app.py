import os
import requests
import json
from flask import current_app, Flask, jsonify, make_response, redirect, render_template, request
import gspread
from jinja2 import Template
from string import Template as Temp
from oauth2client.service_account import ServiceAccountCredentials
from python_graphql_client import GraphqlClient
from datetime import datetime
from whoosh.fields import Schema, ID, TEXT, NUMERIC, DATETIME
from whoosh import index, qparser


app = Flask(__name__, static_folder='./client/build', static_url_path='/')
app.config.from_object('config')

# Load raw json file
with open(r'coursewares.json') as json_file:
    all_coursewares = json.load(json_file)

if not os.path.exists("indexdir"):
    schema = Schema(
        id=ID(stored=True),
        name=TEXT(stored=True),
        course_code=TEXT(stored=True),
        dept=TEXT(stored=True)
        # created_at=DATETIME(),
        # updated_at=DATETIME(),
        # n_modules=NUMERIC(),
        # n_assignments=NUMERIC(),
        # n_pages=NUMERIC(),
        # n_files=NUMERIC(),
        # n_quizzes=NUMERIC(),
        # n_visible_tabs=NUMERIC(),
        # n_students=NUMERIC()
    )
    os.mkdir("indexdir")
    ix = index.create_in('indexdir', schema)
    writer = ix.writer()
    for id in all_coursewares:
        courseware = all_coursewares[id]
        writer.add_document(
            id=id,
            name=courseware['name'],
            course_code=courseware['course_code'],
            dept=courseware['dept'],
            # created_at=datetime.fromisoformat(courseware['created_at'][:-1]),
            # updated_at=datetime.fromisoformat(courseware['updated_at'][:-1]),
            # n_modules=courseware['n_modules'],
            # n_assignments=courseware['n_assignments'],
            # n_pages=courseware['n_pages'],
            # n_files=courseware['n_files'],
            # n_quizzes=courseware['n_quizzes'],
            # n_visible_tabs=courseware['n_visible_tabs'],
            # n_students=courseware['n_students']
        )
    writer.commit()

ix = index.open_dir('indexdir')
qp = qparser.MultifieldParser(['name', 'course_code'], ix.schema)

# Example of one of the courseware of our json file:
# "3196": {
#     "name": "10.34 Numerical Methods: Chem Eng",
#     "course_code": "10.34",
#     "dept": "10 - Department of Chemical Engineering",
#     "created_at": "2020-05-28T02:21:34Z",
#     "updated_at": "2020-12-23T17:20:26Z",
#     "n_modules": 17,
#     "n_assignments": 45,
#     "n_pages": 17,
#     "n_files": 294,
#     "n_quizzes": 2,
#     "n_visible_tabs": 9,
#     "n_students": 69
# },

# Google sheets authorization
scope = ['https://www.googleapis.com/auth/drive']
# creds = ServiceAccountCredentials.from_json_keyfile_name(current_app.config['GSCREDS'], scope)
creds = ServiceAccountCredentials.from_json_keyfile_name('./gsheets_credentials.json', scope)
gsclient = gspread.authorize(creds)
spreadsheet = gsclient.open('publication_candidate_notes')
worksheet = spreadsheet.worksheet('Sheet1')

def error(exception=None):
    """ render error page
    :param exception: optional exception
    :return: the error.html template rendered
    """
    return render_template('error.html')

@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET'])
def index():
    # React client build entry point. It contains a "content_item_return_url" placeholder that is loaded in
    # a JS var as it is needed in the reuse form located in client/components/VideoCard.js
    index_template = Template(open('./client/build/index.html').read())
    return index_template.render(content_item_return_url='')

@app.route('/search', methods=['POST'])
def search():
    if request.method == 'POST':
        search_term = request.form['query']
        q = qp.parse(search_term)
        coursewares = []
        with ix.searcher() as searcher:
            results = searcher.search(q)
            for r in results:
                id = r.fields()['id']
                courseware = all_coursewares[id]
                courseware['id'] = id
                coursewares.append(courseware)

    return jsonify(coursewares)

@app.route('/spreadsheet', methods=['GET', 'POST'])
def spreadsheet():
    if request.method == 'GET':
        courseware_id = request.args.get('coursewareId', type = int)
        records = worksheet.get_all_records()
        # Filter records by courseware_id
        filtered = [r for r in records if r['courseware_id'] == courseware_id]
        # Sort by date, most recent first
        response = sorted(filtered, key=lambda r: datetime.strptime(r['date'], '%m-%d-%Y %H:%M:%S.%f'), reverse=True)
    else:
        courseware_id = request.form['courseware_id']
        publication_candidate = request.form['publication_candidate']
        minimal_copyright = request.form['minimal_copyright']
        comment = request.form['comment']
        date = request.form['date']
        # Save new entry to Google sheets
        worksheet.append_row([courseware_id, publication_candidate, minimal_copyright, comment, date])
        # Build response
        response = {
            'courseware_id': courseware_id,
            'publication_candidate': publication_candidate,
            'minimal_copyright': minimal_copyright,
            'comment': comment,
            'date': date
        }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, threaded=True, port=5000)
