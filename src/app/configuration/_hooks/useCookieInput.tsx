import { useEffect, useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { getDecryptedCookie } from '@/lib/actions/getDecryptedCookie';
import { setEncryptedCookie } from '@/lib/actions/setEncryptedCookie';
import { toast } from 'react-hot-toast/headless';
import { postUser } from '@/app/worklogs/_actions/addJiraUser';

export const useCookieInput = (name: string) => {
	const [isLoaded, setIsLoaded] = useState(false);
	const [value, setValue] = useState('');
	const [description, setDescription] = useState('');
	const [isProcessingValue, setIsProcessingValue] = useState(false);
	const [isProcessingSubmit, setIsProcessingSubmit] = useState(false);
	const [debouncedValue, isDebouncingValue] = useDebounce(value);

	useEffect(() => {
		(async () => {
			const cookieRes = await getDecryptedCookie({ name });
			if (cookieRes.status === 'success') setValue(cookieRes.data);
		})();
	}, [name]);

	useEffect(() => {
		(async () => {
			setIsProcessingValue(true);
			if (isDebouncingValue || debouncedValue === null) return;

			const cookieRes = await getDecryptedCookie({ name });
			if (cookieRes.status !== 'success') {
				setIsLoaded(true);
				setDescription('No stored value found');
			} else if (cookieRes.data === debouncedValue) {
				setIsLoaded(true);
				setDescription('');
			} else if (isLoaded) setDescription('Value not stored');

			setIsProcessingValue(false);
		})();
	}, [isLoaded, debouncedValue, isDebouncingValue, name]);

	const handleSubmit = async (value: string) => {
		setIsProcessingSubmit(true);
		await setEncryptedCookie({ name, value });

		if (name === 'user') {
			await postUser();
		}

		const res = await getDecryptedCookie({ name });

		if (res.status === 'error') {
			toast.error(
				<p>
					Couldn&apos;t store value{value && <strong> {value}</strong>}, please make sure you have cookies
					allowed in your browser and try again later.
				</p>
			);
		}
		if (res.status === 'success' && res.data === value) {
			setDescription('');
			toast.success(<p>Value{value && <strong> {value}</strong>} stored successfully.</p>);
		}
		setIsProcessingSubmit(false);
	};

	return {
		isLoaded,
		value,
		setValue,
		description,
		isProcessingValue,
		isProcessingSubmit,
		handleSubmit
	};
};
