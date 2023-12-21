import React, {useEffect, useState} from 'react';
import './MyGarden.css';
import Container from '../../components/elements/container/Container';
import { auth, db } from '../../config/firebase.ts';
import { getDocs, collection, DocumentData, DocumentSnapshot, doc, updateDoc, deleteField } from "firebase/firestore";
import Button from '../../components/elements/button/Button.tsx';
import PlantInfo from '../../components/elements/plantInformation/PlantInfo.tsx';



interface Plant{
    id: number;
    uniquePlantId: string;
    plantName: string;
    scientificName: string;
    picture: string;
    description: string;

}

interface UserData{
    userId: string;
    plants: Plant[];
}


const MyGarden: React.FC = () => {
    const [userData, setUserData] = useState<UserData[]>();



    const getGarden = async () => {
        try{
            const userId = auth.currentUser?.uid as string;
            const querySnapshot = await getDocs(collection(db, "myGarden"));
            const userDataArray: UserData[] = [];


            querySnapshot.forEach((userDoc: DocumentSnapshot<DocumentData>) => {
                
                const plants: Plant[] = [];
      
                // Iterate through each plant in the user's document
                

                const docData = userDoc.data();
                if (docData) {
                    Object.keys(docData).forEach((plantId) => {
                        const plantData = docData[plantId];
                        plants.push({ id: plantId, ...plantData } as Plant);
                      });
                }
      
                userDataArray.push({ userId: userId, plants });
              });


            setUserData(userDataArray);
            console.log(userData);
        }catch(error){
            console.error(error);
        }
    };


    const handleRemovePlant = async (plantId: string) => {
        try{
            const plantRef = doc(db, "myGarden", auth.currentUser?.uid as string);
            await updateDoc(plantRef, {
                [plantId]: deleteField()
            })
            getGarden();
        }catch(error){
            console.error(error);
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
                                        <h3>{}</h3>
                                        <Container borderRadius='30px'>
                                        <h3>{plant.plantName}</h3>
                                        <p>{plant.scientificName}</p>
                                        <img className="img" src={plant.picture} alt="Picture of plant" />
                                        <PlantInfo plantId={plant.id} />
                                        
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
