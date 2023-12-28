import React, {useEffect, useState} from 'react';
import './MyGarden.css';
import Container from '../../components/elements/container/Container';
import { auth, db } from '../../config/firebase.ts';
import { getDocs, collection, DocumentData, DocumentSnapshot, doc, updateDoc, deleteField, getDoc} from "firebase/firestore";
import Button from '../../components/elements/button/Button.tsx';
import PlantInfo from '../../components/elements/plantInformation/PlantInfo.tsx';
import NotesPopup from '../../components/elements/notesPopup/NotesPopup.tsx';
import NotesContainer from '../../components/elements/notesPopup/NotesContainer.tsx';




interface Plant{
    id: number;
    uniquePlantId: string;
    plantName: string;
    scientificName: string;
    picture: string;
    description: string;
    lastWatered: string;

}

interface UserData{
    userId: string;
    plants: Plant[];
}


const MyGarden: React.FC = () => {
    const [userData, setUserData] = useState<UserData[]>();



    const getGarden = async () => {
        try {
            const userId = auth.currentUser?.uid as string;
            const querySnapshot = await getDocs(collection(db, "myGarden"));
            const userDataArray: UserData[] = [];
    
            querySnapshot.forEach((userDoc: DocumentSnapshot<DocumentData>) => {
                if (userDoc.id === userId) {
                    const plants: Plant[] = [];
    
                    const docData = userDoc.data();
                    if (docData) {
                        Object.keys(docData).forEach((plantId) => {
                            const plantData = docData[plantId];
                            plants.push({ id: plantId, ...plantData } as Plant);
                        });
                    }
    
                    userDataArray.push({ userId: userId, plants });
                }
            });


            setUserData(userDataArray);
            console.log(userDataArray);
        }catch(error){
            console.error(error);
        }
    };






    const handleRemovePlant = async (plantId: string) => {

        if(confirm("Are you sure you want to remove this plant?")){
            try{
                const plantRef = doc(db, "myGarden", auth.currentUser?.uid as string);
                await updateDoc(plantRef, {
                    [plantId]: deleteField()
                })
                getGarden();
            }catch(error){
                console.error(error);
            }
        }
    };


    const handleWaterPlant = async (plantId: string) => {
        try {
            const userId = auth.currentUser?.uid as string;
            const userDocRef = doc(db, "myGarden", userId);
    
            // Fetch the current document data
            const userDocSnapshot = await getDoc(userDocRef);
    
            if (userDocSnapshot.exists()) {
                const userData = userDocSnapshot.data();
    
                if (userData) {
                    const plantData = userData[plantId];
    
                    if (plantData) {
                        const currentTime: string = new Date().toLocaleString();
    
                        // Update the lastWatered field for the specific plant
                        await updateDoc(userDocRef, {
                            [`${plantId}.lastWatered`]: currentTime,
                        });
    
                        console.log("Plant watered successfully!");
                    } else {
                        console.error("No plant data found for plantId:", plantId);
                    }
                }
            } else {
                console.error("User document not found for userId:", userId);
            }
    
            getGarden();
        } catch (error) {
            console.error("Error watering plant: ", error);
        }
    };
    



    useEffect(() => {
        getGarden();
    },[]);




    return (
        <>


            {userData?.map((user) => (
                <div className="grid-container" key={user.userId}>
                        
                    {user.plants.map((plant) => (
                        <div className="grid-item" key={plant.uniquePlantId}>
                            
                            <Container borderRadius='30px'>
                            <h3>{plant.plantName}</h3>
                            <p>{plant.scientificName}</p>
                            <img className="img" src={plant.picture} alt="Picture of plant" />
                            <PlantInfo plantId={plant.id} />
                            
                            <Button text="Water" onClick={() => handleWaterPlant(plant.uniquePlantId)} />
                            { plant.lastWatered === "" ? <p>Never watered</p> : <p>Last watered: {plant.lastWatered}</p> }


                            <NotesPopup><NotesContainer uniquePlantId={plant.uniquePlantId}/></NotesPopup>
                            <br />
                            <Button text="Remove" onClick={() => handleRemovePlant(plant.uniquePlantId)} />
                            </Container>
                            
                        </div>
                    ))}
                    </div>
            ))}
        </>
    );
};

export default MyGarden;
