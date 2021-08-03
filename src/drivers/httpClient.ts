import Axios, { AxiosRequestConfig } from 'axios';

export default function createHttpClient(config: AxiosRequestConfig = {}) {
    return Axios.create(config);
}