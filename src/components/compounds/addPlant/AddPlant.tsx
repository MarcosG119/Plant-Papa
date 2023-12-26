import React, { useState } from 'react';
import Container from '../../elements/container/Container';
import Button from '../../elements/button/Button';

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../../../config/firebase.ts';

import { useNavigate } from 'react-router-dom';


const AddPlant: React.FC = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [picture, setPicture] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [scientificName, setScientificName] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [id, setId] = useState('');

    const navigate = useNavigate();

    const handleClick = async () => {
        try{
            setPicture("https://images.thdstatic.com/productImages/5ed4957b-8edf-4b0f-b4fb-3d6f48a78caa/svn/green-art-prints-julnpp02nfpfl12-64_600.jpg");
            const userId = auth?.currentUser?.uid as string;
            const uniquePlantId = new Date().getTime().toString(); 

            await setDoc(doc(db, "myGarden", userId), {
                    [uniquePlantId]: {
                    plantName: name,
                    scientificName: scientificName,
                    picture: picture,
                    description: description,
                    id: id,
                    uniquePlantId: uniquePlantId,
                    lastWatered: "",
                    notes: []
                }
            }, {merge: true});

            navigate('/my-garden');
        } catch(error){
            console.error(error);
        }
    }

    return (

            <Container borderRadius='30px'>
            <br />
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <br /><br />
            <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <br /><br />
            <Button text="Add plant" onClick={handleClick} />
            <br />
            </Container>
        
    );
};

export default AddPlant;
