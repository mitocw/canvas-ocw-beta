import os
import requests
from isodate import parse_duration
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
        # Instantiate the client with an endpoint.
        bearer_token = Temp('Bearer $token')
        headers = {
            'Authorization': bearer_token.substitute(token=current_app.config['CANVAS_API_KEY'])
        }
        client = GraphqlClient(
            endpoint='https://canvas.instructure.com/api/graphql',
            headers=headers
        )
        # Create the query string and variables required for the request.
        query = """
            query courseInfo($courseId: ID!) {
                course(id: $courseId) {
                    id
                    _id
                    name
                    createdAt
                    updatedAt
                }
            }
        """
        variables = {'courseId': 2066466}
        # Synchronous request
        result = client.execute(query=query, variables=variables)
        print(result)

    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True, threaded=True, port=5000)
