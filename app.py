import os
import requests
from flask import current_app, Flask, jsonify, make_response, redirect, render_template, request
from jinja2 import Template
from string import Template as Temp
from python_graphql_client import GraphqlClient


app = Flask(__name__, static_folder='./client/build', static_url_path='/')
app.config.from_object('config')


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
    result = []
    if request.method == 'POST':
        # Instantiate graphql client with Contentful's endpoint
        bearer_token = Temp('Bearer $token')
        endpoint = Temp('https://graphql.contentful.com/content/v1/spaces/$space_id')
        headers = {
            'Authorization': bearer_token.substitute(token=current_app.config['CONTENTFUL_CPA_TOKEN'])
        }
        client = GraphqlClient(
            endpoint=endpoint.substitute(space_id=current_app.config['CONTENTFUL_SPACE_ID']),
            headers=headers
        )

        search_term = request.form['query']
        variables = {"searchTerm": search_term}

        ##### Search on name, syllabusBody fields and gather courseware ids #####
        query = """
            query($searchTerm: String) {
                coursewareCollection(preview: true, where: {
                    OR: [
                        { name_contains: $searchTerm },
                        { syllabusBody_contains: $searchTerm }
                    ]
                }) {
                    items {
                        id
                    }
                }
            }
        """
        # Synchronous request
        result = client.execute(query=query, variables=variables)
        name_syllabus_courseware_ids = []
        items = result['data']['coursewareCollection']['items']
        for item in items:
            name_syllabus_courseware_ids.append(str(item['id']))
        
        ##### Search on teacher field and gather courseware ids #####
        query = """
            fragment CourseInfo on Courseware {
                id
            }

            query($searchTerm: String) {
                teacherCollection(preview: true, where: {
                    displayName_contains: $searchTerm
                }) {
                    items {
                        linkedFrom {
                            entryCollection(preview: true) {
                                items {
                                    ...CourseInfo
                                }
                            }
                        }
                    }
                }
            }
        """
        # Synchronous request
        result = client.execute(query=query, variables=variables)
        teacher_courseware_ids = []
        items = result['data']['teacherCollection']['items']
        for item in items:
            other_items = item['linkedFrom']['entryCollection']['items']
            for other_item in other_items:
                teacher_courseware_ids.append(str(other_item['id']))
        
        ##### Concatenate courseware lists and remove dupes #####
        courseware_ids = list(set(name_syllabus_courseware_ids + teacher_courseware_ids))

        # Search by course id
        query = """
            fragment DepartmentInfo on Department {
                name
            }

            fragment TeacherInfo on Teacher {
                displayName
            }

            query($coursewareIds: [String]) {
                coursewareCollection(preview: true, where: {
                    id_in: $coursewareIds
                }) {
                    items {
                        name
                        url
                        department {
                            ...DepartmentInfo
                        }
                        teachersCollection {
                            items {
                                ...TeacherInfo
                            }
                        }
                    }
                }
            }
        """
        variables = {"coursewareIds": courseware_ids}
        result = client.execute(query=query, variables=variables)
        coursewares = []
        items = result['data']['coursewareCollection']['items']
        for item in items:
            teachers = []
            for teacher in item['teachersCollection']['items']:
                teachers.append(teacher)
            courseware = {}
            courseware['name'] = item['name']
            courseware['url'] = item['url']
            courseware['department'] = item['department']
            courseware['teachers'] = teachers
            coursewares.append(courseware)

    return jsonify(coursewares)


if __name__ == '__main__':
    app.run(debug=True, threaded=True, port=5000)
