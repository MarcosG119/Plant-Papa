import React from 'react';
import Container from '../../elements/container/Container';
import './SearchContainer.css';
import Button from '../../elements/button/Button';

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../../../config/firebase.ts';

import {SearchContainerProps} from './SearchContainer.ts';

// Add the following imports

const SearchContainer: React.FC<SearchContainerProps> = ({
    name,
    scientificName,
    picture,
    description,
    id
}) => {

    const userId = auth?.currentUser?.uid as string;


    

    const handleClick = async () => {
        try{
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
        } catch(error){
            console.error(error);
        }
    };


    return (

        


        <div className='searchContainer'>
        <Container borderRadius='30px'>
            <h2>{name}</h2>
            <p>Scientific Name: {scientificName}</p>
            
            
            <div className='row'>
            
            
            
            <div className='imgCol'>
            <img className="img" src={picture} alt="Picture of plant" />
            </div>



            <div className='pCol'>
            <p>{description}</p>
            </div>




            
            </div>
            
            <div className='addButton'>
            <Button text="Add to Garden" onClick={handleClick} />
            </div>
            
        </Container>
        </div>
    );
};

export default SearchContainer;
