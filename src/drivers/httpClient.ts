import Axios, { AxiosRequestConfig } from 'axios';
import winston from 'winston';

export default function createHttpClient(config: AxiosRequestConfig = {}, logger: winston.Logger) {
    const http = Axios.create(config);
    return http;
}