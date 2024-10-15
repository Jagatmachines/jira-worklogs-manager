'use server';
import { getMultipleDecryptedCookies } from '@/lib/actions/getMultipleDecryptedCookies';
import addData from '@/lib/config/addDataFirebase';

export const postUser = async () => {
	const cookieRes = await getMultipleDecryptedCookies('user');
		if (cookieRes.status !== 'success') return cookieRes;
		const { user, } = cookieRes.data;

        try {
            const { result, error } = await addData('users', 'user-id', user)
        
            if (error) {
                return console.log(error)
            }

            console.log('Successfully stored', result)
        } catch (error) {
            return console.log(error)
        }
};
