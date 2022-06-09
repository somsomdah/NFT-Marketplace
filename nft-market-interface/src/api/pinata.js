//imports needed for this function
import FormData from 'form-data'
import { _query } from './_query';

export const pinFileToIPFS = (image) => {

    let data = new FormData();
    data.append('file', image);
    return _query({ method: 'POST', url: 'pinning/pinFileToIPFS', data: data });
};