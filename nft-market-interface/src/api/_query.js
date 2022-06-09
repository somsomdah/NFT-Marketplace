import axios from 'axios'
import { KEY } from './keys';

const baseUrl = 'https://api.pinata.cloud'

const _query = async ({ method, url, params = null, data = null }) => {

    const urlWithBase = `${baseUrl}/${url}`
    try {

        const response = await axios(
            {
                method: method,
                url: urlWithBase,
                params: params,
                data: data,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    'pinata_api_key': KEY.API_Key,
                    'pinata_secret_api_key': KEY.API_Secret
                },
                maxBodyLength: 'Infinity',
            }
        )

        printResponse(method, urlWithBase, response)

        return response.data

    } catch (error) {
        printError(method, urlWithBase, error)
    }
}



const printResponse = (method, url, response) => {
    console.log('==========================================')
    console.log(`[METHOD] ${method}`)
    console.log(`[URL] ${url}`)
    console.log(`[STATUS] ${response.status}`);
    console.log(`[RESPONSE] \n${JSON.stringify(response.data, null, 4)}`);
    console.log('==========================================');
}

const printError = (method, url, error) => {
    console.log('==========================================');
    console.log(`[METHOD] ${method}`)
    console.log(`[URL] ${url}`)
    console.log(`[STATUS] ${error.response?.status}`);
    console.log(`[ERROR] \n${JSON.stringify(error.response?.data || error.message, null, 4)}`);
    console.log('==========================================');
}




export { _query };