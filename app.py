import os
import requests
import json
import functools
import gspread
import google.oauth2.credentials
import googleapiclient.discovery
from flask import current_app, Flask, jsonify, make_response, redirect, render_template, request, session
from jinja2 import Template
from string import Template as Temp
from oauth2client.service_account import ServiceAccountCredentials
from authlib.integrations.requests_client import OAuth2Session
from python_graphql_client import GraphqlClient
from datetime import datetime
from whoosh.fields import Schema, ID, TEXT, NUMERIC, DATETIME
from whoosh import index, qparser


app = Flask(__name__, static_folder='./client/build', static_url_path='/')
app.config.from_object('config')

# Load raw json file
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
with open(r'coursewares.json') as json_file:
    all_coursewares = json.load(json_file)

if not os.path.exists('indexdir'):
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

if not os.path.exists('departments.json'):
    all_departments = []
    for id in all_coursewares:
        courseware = all_coursewares[id]
        all_departments.append(courseware['dept'])
    all_departments = list(set(all_departments))
    all_departments.sort()
    with open('departments.json', 'w') as json_file:
        json.dump(all_departments, json_file)
else:
    with open(r'departments.json') as json_file:
        all_departments = json.load(json_file)

ix = index.open_dir('indexdir')
qp = qparser.MultifieldParser(['name', 'course_code'], ix.schema)

# Google sheets authorization
scope = ['https://www.googleapis.com/auth/drive']
creds = ServiceAccountCredentials.from_json_keyfile_name('./gsheets_credentials.json', scope)
gsclient = gspread.authorize(creds)
spreadsheet = gsclient.open('publication_candidate_notes')
worksheet = spreadsheet.worksheet('Sheet1')

authsheet = gsclient.open('user_management_canvas_intel')
authlist = authsheet.worksheet('authorization').col_values(1)

# Google authentication
ACCESS_TOKEN_URI = 'https://www.googleapis.com/oauth2/v4/token'
AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent'
AUTHORIZATION_SCOPE ='openid email profile'

AUTH_REDIRECT_URI = app.config['GOOGLE_AUTH_REDIRECT_URI']
BASE_URI = app.config['GOOGLE_BASE_URI']
CLIENT_ID = app.config['GOOGLE_CLIENT_ID']
CLIENT_SECRET = app.config['GOOGLE_CLIENT_SECRET']

AUTH_TOKEN_KEY = 'auth_token'
AUTH_STATE_KEY = 'auth_state'

def paginate(data, offset=0, limit=5):
    return data[offset: offset + limit]

def error(exception=None):
    """ render error page
    :param exception: optional exception
    :return: the error.html template rendered
    """
    return render_template('error.html')

def is_logged_in():
    return True if AUTH_TOKEN_KEY in session else False

def build_credentials():
    if not is_logged_in():
        raise Exception('User must be logged in')

    oauth2_tokens = session[AUTH_TOKEN_KEY]
    
    return google.oauth2.credentials.Credentials(
        oauth2_tokens['access_token'],
        refresh_token=oauth2_tokens['refresh_token'],
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        token_uri=ACCESS_TOKEN_URI
    )

def get_user_info():
    credentials = build_credentials()

    oauth2_client = googleapiclient.discovery.build(
        'oauth2', 'v2',
        credentials=credentials
    )

    return oauth2_client.userinfo().get().execute()

def no_cache(view):
    @functools.wraps(view)
    def no_cache_impl(*args, **kwargs):
        response = make_response(view(*args, **kwargs))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response

    return functools.update_wrapper(no_cache_impl, view)

@app.route('/google/login')
@no_cache
def login():
    oauth2_session = OAuth2Session(
        CLIENT_ID,
        CLIENT_SECRET,
        scope=AUTHORIZATION_SCOPE,
        redirect_uri=AUTH_REDIRECT_URI
    )
  
    uri, state = oauth2_session.create_authorization_url(AUTHORIZATION_URL)

    session[AUTH_STATE_KEY] = state
    session.permanent = True

    return redirect(uri, code=302)

@app.route('/google/auth')
@no_cache
def auth_redirect():
    req_state = request.args.get('state', default=None, type=None)

    if req_state != session[AUTH_STATE_KEY]:
        response = make_response('Invalid state parameter', 401)
        return response
    
    oauth2_session = OAuth2Session(
        CLIENT_ID,
        CLIENT_SECRET,
        scope=AUTHORIZATION_SCOPE,
        state=session[AUTH_STATE_KEY],
        redirect_uri=AUTH_REDIRECT_URI
    )

    oauth2_tokens = oauth2_session.fetch_token(
        ACCESS_TOKEN_URI,
        authorization_response=request.url
    )

    session[AUTH_TOKEN_KEY] = oauth2_tokens

    return redirect(BASE_URI, code=302)

@app.route('/google/logout')
@no_cache
def logout():
    session.pop(AUTH_TOKEN_KEY, None)
    session.pop(AUTH_STATE_KEY, None)

    return redirect(BASE_URI, code=302)

@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET'])
def index():
    user_info = get_user_info()
    if is_logged_in() and user_info['email'] in authlist:
        # React client build entry point.
        index_template = Template(open('./client/build/index.html').read())
        return index_template.render()
    return '<a class="button" href="/google/login">Google Login</a>'

@app.route('/search', methods=['POST'])
def search():
    if request.method == 'POST':
        search_term = request.form['query']
        department = request.form['department']
        offsetStr = request.args.get('offset')
        limitStr = request.args.get('limit')
        if offsetStr and limitStr:
            paginated_response = True
            offset = int(offsetStr)
            limit = int(limitStr)
        else:
           paginated_response = False
        coursewares = []
        if search_term:
            q = qp.parse(search_term)
            with ix.searcher() as searcher:
                results = searcher.search(q)
                for r in results:
                    id = r.fields()['id']
                    courseware = all_coursewares[id]
                    courseware['id'] = id
                    coursewares.append(courseware)
        else:
            for id in all_coursewares:
                courseware = all_coursewares[id]
                courseware['id'] = id
                coursewares.append(courseware)
        # Filter by department
        if department != 'All':
            coursewares = [c for c in coursewares if c['dept'] == department]
    if paginated_response:
        return jsonify({
            'coursewares': paginate(coursewares, offset, limit),
        })
    else:
        return jsonify({
            'total_coursewares': len(coursewares)
        })

@app.route('/departments', methods=['GET'])
def departments():
    return jsonify(all_departments)

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
