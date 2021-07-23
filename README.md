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
