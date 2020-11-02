# canvas-ocw-beta
Exploring transfer of Canvas materials to a future OCW authoring system.

From the client directory:

```
npm install
npm run start
```

The start command automatically open your default browser at the following address: http://localhost:3000/

The flask backend must be started before one can actually search. Create a virtual environment and start the app.
```
python -m venv venv
. venv/bin/activate
pip install -r requirements.txt
python app.py
```

The flask app is visible at: http://localhost:5000/

In the `client/package.json`, you'll see the following line for the proxy: 
`"proxy": "http://localhost:5000"`

Any request that is not on port 3000 will be redirected to 5000. 

From `/client`, type `npm run build`. Once completed, open your browser at the Flask server at http://127.0.0.1:5000/ and you'll see the React build!

PLACEHOLDER FOR HEROKU
* You must add the nodejs buildpack within the settings of your heroku app.
* You also need to add the YouTube API key to your configuration variables on heroku.com

# ocw-youtube-lti
Search and embed OCW YouTube videos from the (https://community.canvaslms.com/docs/DOC-10728-what-is-the-rich-content-editor)[Canvas RCE] (Rich Content Editor). (https://www.imsglobal.org/activity/learning-tools-interoperability)Canvas App integrations via [LTI] (Learning Technology Interoperability) allow tools for creating/integrating content to be directly added to a course authors workflow (RCE). 

We hope to motivate possibilities for existing content across MIT to find ways into authoring flows inside Canvas (coming to MIT Fall 2020). This app provides a roadmap for an integration with the RCE. LTI tools can also be embedded without the RCE and this app can be adapted to for those needs (e.g., directly linking a tool in the Modules section of a Canvas course). 

Two codebases were utlized together in order to show this proof of concept. 
* YouTube Flask App: [Create a YouTube Search App in Flask Using the YouTube Data API](https://github.com/PrettyPrinted/youtube_video_code/tree/master/2019/07/28/Create%20a%20YouTube%20Search%20App%20in%20Flask%20Using%20the%20YouTube%20Data%20API)
* PyLTI is an MIT maintained package that streamlines LTI implementations; it drastically simplified this prototype.

## Demo
![](static/Jul-14-2020_OCW_YouTube_LTI_tool.gif)

## Things you will need
This app should be deployable on Heroku with minimal changes. 
* (https://devcenter.heroku.com/articles/git)[Deploy with Heroku].
* (https://developers.google.com/youtube/v3/getting-started)[YouTube > Data API] key is needed to query YouTube (covered in the Pretty Printed walkthrough below). 

## Possibly coming soon...
If needed, we will round out some of the documentation related to installing in Canvas and other configurations.

