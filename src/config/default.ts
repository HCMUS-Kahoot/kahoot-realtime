import { PORT, REST_API } from '../constant';

export default () => ({
  [PORT]: process.env[PORT],
  [REST_API]: process.env[REST_API],
});
