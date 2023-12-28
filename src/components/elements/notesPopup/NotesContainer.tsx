import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase.ts';

interface NotesComponentProps {
  uniquePlantId: string;
}


const NotesComponent: React.FC<NotesComponentProps> = ({ uniquePlantId }) => {
    const [notes, setNotes] = useState<string[]>([]);
    const [newNote, setNewNote] = useState<string>('');
    const userId = auth.currentUser?.uid;
  
    // Fetch existing notes when the component mounts
    useEffect(() => {
      const fetchNotes = async () => {
        try {
            if (!userId) {
                console.error('User ID is not available.');
                return;
            }
    
            const plantDocRef = doc(db, 'myGarden', userId);
            const plantDocSnapshot = await getDoc(plantDocRef);
    
            if (plantDocSnapshot.exists()) {
                const plantData = plantDocSnapshot.data();
                const plantMap = plantData?.[uniquePlantId];
                setNotes(plantMap?.notes || []);
            }
            } catch (error) {
            console.error('Error fetching notes:', error);
            }
      };
  
        fetchNotes();
    }, [userId, uniquePlantId]);
  
    // Add a new note
    const addNote = async () => {
        try {
            if (!userId) {
                console.error('User ID is not available.');
                return;
            }
        
            const plantDocRef = doc(db, 'myGarden', userId);
            const plantDocSnapshot = await getDoc(plantDocRef);
        
            if (plantDocSnapshot.exists()) {
                const currentData = plantDocSnapshot.data();
                const currentPlantMap = currentData?.[uniquePlantId];
        
                // Get the current date
                const currentDate = new Date().toLocaleDateString();
        
                // Create the new note with the current date
                const newNoteWithDate = `${currentDate}: ${newNote}`;
        
                // Merge existing fields with the new 'notes' including the new note
                const updatedPlantMap = {
                ...currentPlantMap,
                notes: [...notes, newNoteWithDate],
                };
        
                // Update the document with the merged data
                await updateDoc(plantDocRef, {
                [uniquePlantId]: updatedPlantMap,
                });
        
                setNotes(updatedPlantMap?.notes || []);
                setNewNote('');
            }
        } catch (error) {
          console.error('Error adding note:', error);
        }
      };
  
    // Remove a note by index
    const removeNote = async (index: number) => {
      try {
        if (!userId) {
            console.error('User ID is not available.');
            return;
        }
  
        const plantDocRef = doc(db, 'myGarden', userId);
        const plantDocSnapshot = await getDoc(plantDocRef);
  
        if (plantDocSnapshot.exists()) {
            const currentData = plantDocSnapshot.data();
            const currentPlantMap = currentData?.[uniquePlantId];
    
            // Merge existing fields with the updated 'notes'
            const updatedPlantMap = {
                ...currentPlantMap,
                notes: [...notes.slice(0, index), ...notes.slice(index + 1)],
            };
    
            // Update the document with the merged data
            await updateDoc(plantDocRef, {
                [uniquePlantId]: updatedPlantMap,
            });
    
            setNotes(updatedPlantMap?.notes || []);
            }
      } catch (error) {
        console.error('Error removing note:', error);
      }
    };
  
    return (
      <div>
        <h3>Notes</h3>
        <ul>
            {notes.map((note, index) => (
                <li key={index}>
                    {note}
                    <button onClick={() => removeNote(index)}>Remove</button>
                </li>
            ))}
        </ul>
        <div>
            <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a new note"
            />
            <button onClick={addNote}>Add Note</button>
        </div>
      </div>
    );
  };
  
  export default NotesComponent;
  
  
  
  