import React, { useState } from 'react';
import { createUserWithEmailAndPassword,signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase.ts';
import './UserAuthentication.css';
import logo from '../../images/plant_papa_logo.png';

import TextInput from '../../components/elements/textInput/TextInput.tsx';
import Button from '../../components/elements/button/Button.tsx';
import { useNavigate } from 'react-router-dom';



import { db } from '../../config/firebase.ts';
import { doc, setDoc } from "firebase/firestore";



const UserAuthentication: React.FC = () => {


    const[email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');
    const [userError, setUserError] = useState<string>('');

    console.log(auth?.currentUser?.email);

    const navigate = useNavigate();

    const createUser = async () => {
        try{
            await createUserWithEmailAndPassword(auth, email, password);
            await signInWithEmailAndPassword(auth, email, password);
 


        //     await setDoc(doc(db, "myGarden", auth.currentUser?.uid as string), {
        //         [uniquePlantId]: {
        //         plantName: name,
        //         scientificName: scientificName,
        //         picture: picture,
        //         description: description,
        //         id: id,
        //         uniquePlantId: uniquePlantId,
        //         lastWatered: "",
        //         notes: []
        //     }
        // }, {merge: true});


            // await setDoc(doc(db, "myGarden", auth?.currentUser?.uid as string), {
            //     plantName: [],
            //     scientificName: [],
            //     picture: [],
            //     description: []
            // });

            setUserError('');
            navigate('/');
        }catch(error){
            console.log(error);
            setUserError(error as string);
            alert(userError);
        }
        
    };

    const login = async () => {
        try{
            await signInWithEmailAndPassword(auth, email, password);
            setUserError('');
            navigate('/');
        }catch(error){
            console.log(error);
            const errorMessage = error as string;
            setUserError(errorMessage);
            alert(userError);
        }
    }


    const handlePasswordChange = (e: string) => {
        setPassword(e);
        setPasswordError('');

        const characterCount = e.replace(/\d/g, '').length;
        const numberCount = e.replace(/\D/g, '').length;

        if (characterCount < 3 || numberCount < 2) {
            setPasswordError('Password must have at least 3 characters and 2 numbers!');
        }
    };

 
    return (
        <div>
            <br />
            <img src={logo} alt="Plant Papa Logo" />
            <div className='user-authentication'>
                <h1>Sign In</h1>
                <div>
                    <TextInput type='email' value={email} onChange={(e: string) => setEmail(e)} placeholder='Email' />
                    <br />
                    <br />
                    <TextInput type='password' value={password} onChange={handlePasswordChange} placeholder='Password' />
                    {passwordError && <div className="error">{passwordError}</div>}
                    <br />
                    <br />
                    <div className="center-buttons">
                        <Button text='Sign In' onClick={login} />
                        &emsp;&emsp;&emsp;
                        <Button text='Sign Up' onClick={createUser} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserAuthentication;