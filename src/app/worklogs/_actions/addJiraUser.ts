'use server';
import { getMultipleDecryptedCookies } from '@/lib/actions/getMultipleDecryptedCookies';
import { database } from '@/lib/config/firebase';
import { set, ref, push } from "firebase/database";

// import db from '../../../lib/config/addDataFirebase';
// import { collection, addDoc } from "firebase/firestore";

export const postUser = async () => {
	const cookieRes = await getMultipleDecryptedCookies('user');
		if (cookieRes.status !== 'success') return cookieRes;
		const { user } = cookieRes.data;

        try {
            // const docRef = await addDoc(collection(db, "users"), {
            //     name: user
            // });
            // console.log("Document written with ID: ", docRef.id);

            const usersRef = ref(database, "users");
            const newUserRef = push(usersRef); // Generates a unique ID for the new user

            set(newUserRef, {
                userName: user
            });
            console.log("Successfully Added User to firebase👍");
        } catch (error) {
            console.log('Error adding document', error);
        }
};
