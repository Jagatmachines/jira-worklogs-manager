'use server';

import 'server-only';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Action } from '@/types/types';

const cookieSecret = process.env.COOKIE_SECRET;
if (typeof cookieSecret === 'undefined') throw new Error('Missing COOKIE_SECRET env variable');
const encodedSecret = new TextEncoder().encode(cookieSecret);

export const getDecryptedCookie: Action<string, 'name'> = async ({ name }) => {
	const encryptedCookie = cookies().get(name)?.value;
	if (typeof encryptedCookie === 'undefined') {
		return {
			errors: [
				`Could not get value of '${name}'. Please make sure you have it set in your configuration tab, have cookies allowed in your browser and try again.`
			],
			status: 'error'
		};
	}
	const jwtVerifyResult = await jwtVerify<{ value: string }>(encryptedCookie, encodedSecret, {
		algorithms: ['HS256']
	});
	return { data: jwtVerifyResult.payload.value, status: 'success' };
};
