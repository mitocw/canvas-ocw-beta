import os
import requests
import json
import re
import functools
import copy
import gspread
import google.oauth2.credentials
import googleapiclient.discovery
from functools import cmp_to_key
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
with open(r'coursewares.json') as json_file:
    all_coursewares = json.load(json_file)

all_coursewares_indexed = {}
for courseware in all_coursewares:
    courseware['id'] = courseware.pop('course_id')
    all_coursewares_indexed[courseware['id']] = courseware

if not os.path.exists('indexdir'):
    schema = Schema(
        id=ID(stored=True),
        name=TEXT(stored=True),
        dept=TEXT(stored=True),
        enrollment_term=TEXT(stored=True)
    )
    os.mkdir("indexdir")
    ix = index.create_in('indexdir', schema)
    writer = ix.writer()
    for courseware in all_coursewares:
        writer.add_document(
            id=courseware['id'],
            name=courseware['name'],
            dept=courseware['dept'],
            enrollment_term=courseware['enrollment_term']
        )
    writer.commit()

if not os.path.exists('departments.json'):
    department_numbers = []
    department_words = []
    unsorted_departments = [courseware['dept'] for courseware in all_coursewares]
    unsorted_departments = list(set(unsorted_departments))
    for department in unsorted_departments:
        # Check if first word of department contains any digit
        if any(map(str.isdigit, department.split(' ', 1)[0])):
            department_numbers.append(department)
        else:
            department_words.append(department)
    convert = lambda text: int(text) if text.isdigit() else text 
    alphanum_key = lambda key: [convert(c) for c in re.split('([0-9]+)', key)] 
    department_numbers.sort(key=alphanum_key)
    department_words.sort()
    all_departments = department_numbers + department_words
    with open('departments.json', 'w') as json_file:
        json.dump(all_departments, json_file)
else:
    with open(r'departments.json') as json_file:
        all_departments = json.load(json_file)

if not os.path.exists('terms.json'):
    seasons = {
        'Spring': 1,
        'Summer': 2,
        'Fall': 3,
        'Winter': 4,
    }
    # Assumes strings are in the following format: Fall Term (AY 2020-2021)
    def cmp(a, b):
        a_list = a.split()
        a_season,a_year = a_list[0],a_list[3].split('-')[0]
        b_list = b.split()
        b_season,b_year = b_list[0],b_list[3].split('-')[0]
        return int(b_year) - int(a_year) or seasons[a_season] - seasons[b_season]

    unsorted_terms = [courseware['enrollment_term'] for courseware in all_coursewares]
    unsorted_terms = list(set(unsorted_terms))
    all_terms = sorted(unsorted_terms, key=cmp_to_key(cmp))
    with open('terms.json', 'w') as json_file:
        json.dump(all_terms, json_file)
else:
    with open(r'terms.json') as json_file:
        all_terms = json.load(json_file)

ix = index.open_dir('indexdir')
qp = qparser.MultifieldParser(['name'], ix.schema)

# Google sheets authorization
GOOGLE_APPLICATION_CREDENTIALS = app.config['GOOGLE_APPLICATION_CREDENTIALS']

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

worksheet = None
authlist = None
user_name = ''
user_picture = ''

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

@app.before_first_request
def get_google_sheets():
    scope = ['https://www.googleapis.com/auth/drive']
    creds = ServiceAccountCredentials.from_json_keyfile_name(GOOGLE_APPLICATION_CREDENTIALS, scope)
    gsclient = gspread.authorize(creds)
    spreadsheet = gsclient.open('publication_candidate_notes')
    authsheet = gsclient.open('user_management_canvas_intel')
    global worksheet
    global authlist
    worksheet = spreadsheet.worksheet('Sheet1')
    authlist = authsheet.worksheet('authorization').col_values(1)

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
    if is_logged_in():
        user_info = get_user_info()
        if user_info['email'] in authlist:
            # Store user name for ulterior usage in comments
            global user_name, user_picture
            user_name = user_info['name'] if user_info['name'] else user_info['email']
            user_picture = user_info['picture'] if user_info['picture'] else ''
            # React client build entry point.
            index_template = Template(open('./client/build/index.html').read())
            return index_template.render()
        else:
            return '<p>You are not authorized to view this application</p>'
    return '<a href="/google/login">Google Login</a>'

@app.route('/search', methods=['POST'])
def search():
    if request.method == 'POST':
        search_term = request.form['query']
        if search_term:
            search_term = '*' + search_term + '*' # Add wildcards for partial matches
        dept = request.form['department']
        enrollment_term = request.form['term']
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
                results = searcher.search(q, limit=None)
                for r in results:
                    id = r.fields()['id']
                    coursewares.append(all_coursewares_indexed[id])
        else:
            coursewares = copy.deepcopy(all_coursewares)
        # Filter by department and enrollment term
        if dept != 'All':
            if enrollment_term != 'All':
                coursewares = [c for c in coursewares if c['dept'] == dept and c['enrollment_term'] == enrollment_term]
            else:
                coursewares = [c for c in coursewares if c['dept'] == dept]
        else:
            if enrollment_term != 'All':
                coursewares = [c for c in coursewares if c['enrollment_term'] == enrollment_term]
            else:
                pass
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

@app.route('/terms', methods=['GET'])
def terms():
    return jsonify(all_terms)

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
        courseware_name = request.form['courseware_name'] # Only used in worksheet, not client-side
        publication_candidate = request.form['publication_candidate']
        minimal_copyright = request.form['minimal_copyright']
        comment = request.form['comment']
        date = request.form['date']
        # Save new entry to Google sheets
        worksheet.append_row([
            courseware_id,
            courseware_name,
            publication_candidate,
            minimal_copyright,
            comment,
            user_picture,
            user_name,
            date
        ])
        # Build response
        response = {
            'courseware_id': courseware_id,
            'publication_candidate': publication_candidate,
            'minimal_copyright': minimal_copyright,
            'comment': comment,
            'user_picture': user_picture,
            'user_name': user_name,
            'date': date
        }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, threaded=True, port=5000)
