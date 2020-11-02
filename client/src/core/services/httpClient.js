import Axios from 'axios';

const httpClient = Axios.create({
  // Set up defaults here if ever needed, like
  // baseURL: process.env.REACT_APP_API_URL,
  // port: process.env.REACT_APP_API_PORT,
  // These should eventually be located in .env* files
  // (.env.development, .env.test, .env.production...)
  // https://create-react-app.dev/docs/adding-custom-environment-variables/#adding-development-environment-variables-in-env
});

export default httpClient;
